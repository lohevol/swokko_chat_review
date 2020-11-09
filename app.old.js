var messageText = document.getElementById("messageText"); //Input сообщения
var messageSendButton = document.getElementById("messageSendButton"); //Кнопка отправки сообщения
var messageList = document.getElementById("messageList"); //Список сообщений
var profileMenuList = document.getElementById("profileMenuList"); //Всплывающее меню профиля
var profileMenuArrow = document.getElementById("profileMenuArrow"); //Стрелочка рядом с именем для открытия меню профиля
var headerTitleUserName = document.getElementById("headerTitleUserName"); //Имя пользователя в шапке
var headerTitleUserAvatar = document.getElementById("headerTitleUserAvatar"); //Аватарка пользователя в шапке
//var test8438 = setInterval(sendNotification, 5000);
var msgRef = firebase.database().ref("messages"); //Сокращение обращения к базе сообщений
var errRef = firebase.database().ref("errors"); //Сокращение обращения к базе ошибок
var moderators = ["dsvatd@mail.ru", "noreply@mail.ru"];

var profileMenuIsOpen = false;

//Вход через Google
function login() {
  var provider = new firebase.auth.GoogleAuthProvider();
  if (screen.width > 1023) { //Если пользователь зашёл с компьютера, то входим с помощью всплывающего окна
    firebase.auth().signInWithPopup(provider).then(function (result) {
      console.log("Вход выполнен успешно");
    }).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var email = error.email;
      var credential = error.credential;

      //Ловим ошибку и записываем её в базу данных, чтобы потом её исправить
      errRef.push().set({
        code: errorCode,
        message: errorMessage,
        mail: email,
        credential: credential,
        errorCreatedAt: `${getTimeByTimestamp(Date.now())}`,
        type: "SignInWithPopup",
      });
    });
  } else { //Если пользователь зашёл с телефона или планшета, то входим с помощью редиректа на accounts.google.com
    firebase.auth().signInWithRedirect(provider);
    firebase.auth().getRedirectResult().then(function (result) {
      console.log("Вход выполнен успешно");
    }).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var email = error.email;
      var credential = error.credential;

      //Ловим ошибку и записываем её в базу данных, чтобы потом её исправить
      errRef.push().set({
        code: errorCode,
        message: errorMessage,
        mail: email,
        credential: credential,
        errorCreatedAt: `${getTimeByTimestamp(Date.now())}`,
        type: "SignInWithRedirect",
      });
    });
  }
}

function exit() {
  firebase.auth().signOut();
  window.location.reload();
}

//Получение данных пользователя
function getUser(arg) {
  if (userSignedIn()) {
    if (arg == "nickname") {
      return firebase.auth().currentUser.displayName;
    } else if (arg == "mail") {
      return firebase.auth().currentUser.email;
    } else if (arg == "name") {
      return firebase.auth().currentUser.displayName;
    } else if (arg == "photo") {
      return firebase.auth().currentUser.photoURL || "https://im0-tub-ru.yandex.net/i?id=6513e2393ba9bb3ff9721ef864a1df2d&n=13";
    } else if (arg == "uid") {
      return firebase.auth().currentUser.email;
    }
  } else {
    if (arg == "photo") { return "https://im0-tub-ru.yandex.net/i?id=6513e2393ba9bb3ff9721ef864a1df2d&n=13"; } else { return 123; }
  }
}

var close = document.getElementsByClassName("closebtn");
var i;

// Loop through all close buttons
for (i = 0; i < close.length; i++) {
  // When someone clicks on a close button
  close[i].onclick = function () {

    // Get the parent of <span class="closebtn"> (<div class="alert">)
    var div = this.parentElement;

    // Set the opacity of div to 0 (transparent)
    div.style.opacity = "0";

    // Hide the div after 600ms (the same amount of milliseconds it takes to fade out)
    setTimeout(function () { div.style.display = "none"; }, 600);
  }
}

function userSignedIn() { return !!firebase.auth().currentUser; }

//Отправка сообщения
function sendMessage() {
  if (!messageText.value) { return false; } else if (!userSignedIn()) { return false; } else {
    msgRef.push().set({
      avatar: getUser("photo"),
      name: getUser("name"),
      mail: getUser("mail"),
      text: messageText.value,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
    });
    messageText.value = null;
    return false;
  }
};

//Удаление сообщения
function deleteMessage(self) {
  var messageID = self.getAttribute("data-id");
  msgRef.child(messageID).remove();
}

//Загрузка 50 последних сообщений и обработка новых
function loadMessages() {
  msgRef.orderByChild("createdAt").limitToLast(50).on("child_added", function (snapshot) {
    var html = "";
    html += `<div id="msg-#${snapshot.key}" class="messageContainer">`;
    html += `<div class="messageInnerSender">${snapshot.val().name}</div>`;
    html += `<div class="messageCreatedAt">${getTimeByTimestamp(snapshot.val().createdAt)}</div> <br>`;
    html += `<img class="messageInnerAvatar" src=${snapshot.val().avatar}>`;

    if ((snapshot.val().mail == getUser("mail")) || (moderators.indexOf(getUser("mail")) != -1)) {
      html += `<button data-id="${snapshot.key}" onclick="deleteMessage(this);" class="messageDeleteButton"> ✖ </button>`;
    }

    html += `<div class="messageInnerText">${snapshot.val().text}</div>`;
    html += "</div>"
    messageList.innerHTML += html;
    messageText.value = null;
    messageList.scrollTop = messageList.scrollHeight;

  }, function (errorObject) {
    console.error("Ошибка чтения с БД: " + errorObject.code);
  });
}

//Обработка удаления сообщения
msgRef.on("child_removed", function (snapshot) {
  document.getElementById(`msg-#${snapshot.key}`).remove();
});

//Уведомления
function alertWindow(arg) {
  if (arg == "emptyInput") {
    alert("Вы не ввели сообщение!");
  }
}

//Получение времени по timestamp
function getTimeByTimestamp(timestamp) {
  var time = new Date(timestamp);
  var month = time.getMonth();
  var day = time.getDate();
  var hour = time.getHours();
  var min = time.getMinutes();
  if (min < 10) {
    min = "0" + min;
  };
  return `${hour}:${min}`;
}

function openProfileMenu() {
  if (!profileMenuIsOpen) {
    profileMenuList.removeAttribute("hidden");
    profileMenuIsOpen = true;
    profileMenuArrow.className = "top-arrow";
  } else {
    profileMenuList.setAttribute("hidden", "true")
    profileMenuIsOpen = false;
    profileMenuArrow.className = "bottom-arrow";
  }
}

function sendNotification(arg1 = "Тестовый заголовок", arg2 = "Тестовое описание") {
  var html1 = "";
  var randomID = Math.random()
  html1 += `<div id="alert-${randomID}" class="alertContainer">`;
  html1 += `<span class="alertCloseButton" onclick="this.parentElement.remove()">&times;</span>`;
  html1 += `<span class="alertTitle">${arg1}</span>`;
  html1 += `<p class="alertDecription">${arg2}</p> </div>`;

  var alerts = document.getElementById("alertsBox");
  alerts.innerHTML += html1;

  var alertContainerLast = alerts.lastChild;
  alertContainerLast.style.animationDelay = '0s';
  setTimeout(alertCompleteAnimation, 1000);
}

function alertCompleteAnimation() {
  document.getElementById("alertsBox").lastChild.style.animationDelay = '999999999999s';
}

//Проверка входа/выхода пользователя и изменение страницы
function authStateObserver(user) {
  if (user) {
    profileMenuUsername.textContent = getUser("name");
    headerTitleUserAvatar.setAttribute("src", getUser("photo"));

    document.getElementById("signInWithGoggleButton").setAttribute("hidden", "true");
    document.getElementById("exitButton").removeAttribute("hidden");
    //document.getElementById("messageText").removeAttribute("hidden");
    //document.getElementById("messageSendButton").removeAttribute("hidden");
    document.getElementById("profile").removeAttribute("hidden");
  } else {
    profileMenuUsername.textContent = "Гость";
    headerTitleUserAvatar.setAttribute("src", "https://im0-tub-ru.yandex.net/i?id=6513e2393ba9bb3ff9721ef864a1df2d&n=13");

    document.getElementById("signInWithGoggleButton").removeAttribute("hidden");
    document.getElementById("exitButton").setAttribute("hidden", "true");
    //document.getElementById("messageText").setAttribute("hidden", "true");
    //document.getElementById("messageSendButton").setAttribute("hidden", "true");
    document.getElementById("profile").setAttribute("hidden", "true");
  }
}

//Нужная хрень из документации по Firebase
firebase.auth().onAuthStateChanged(authStateObserver);
loadMessages();