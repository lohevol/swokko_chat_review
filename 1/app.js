// предупрежу, комментариев много)

// переделал структуру селекторов через объекты
// раньше была например переменная headerTitleUserName - она длинная, и выглядит не очень красиво
// а через объекты можно сделать это красиво, а также вкладывать до бесконечности

const messageForm = {
  input: document.getElementById("messageForm.input"), //Input сообщения
  sendButton: document.getElementById("messageSendButton"), //Кнопка отправки сообщения
}
const messagesList = document.getElementById("messageList") //Список сообщений
const profile = {
  menu: {
    list: document.getElementById("profileMenuList"), //Всплывающее меню профиля
    arrow: document.getElementById("profileMenuArrow"), //Стрелочка рядом с именем для открытия меню профиля
    title: { // вложенность
      user: { // вложенность
        name: document.getElementById("headerTitleUserName"), //Имя пользователя в шапке
        avatar: document.getElementById("headerTitleUserAvatar") //Аватарка пользователя в шапке
      }
    }
  }
}

const close = document.getElementsByClassName("closebtn");

// Loop through all close buttons
close.forEach(btn => { // "новый" метод forEach для пробежки по массивам вместо цикла
// When someone clicks on a close button
btn.addEventListener('click', function() { // метод addEventListener тоже поновее чем .onclick и удобнее
  // Get the parent of <span class="closebtn"> (<div class="alert">)
  const div = this.parentElement;
  
  // Set the opacity of div to 0 (transparent)
  div.style.opacity = "0"; // задай элементу в css свойство transition: 0.6s или 600ms и тогда будет все плавно
  
  // Hide the div after 600ms (the same amount of milliseconds it takes to fade out)
  setTimeout(() => div.style.display = "none", 600);
});
});
// const test8438 = setInterval(sendNotification, 5000);

// вспомогательные функции/классы
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
// генератор случайных id для сообщений
class Randomer {
  constructor(){
    this.symbols = [
      "a", "2", "c", "d", "g", "f", "4", "h", "i", "j",
      "k", "l", "7", "n", "o", "p", "q", "8", "s",
      "t", "u", "0", "b", "3", "y", "z",
      "v", "1", "w", "x", "e", "5", "6", "m", "r", "9"
    ]
  }
  getRandomNum(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min;
  }
  getRandomId(length){
    let id = '';
    
    const random = {
      num: 0,
      symbol: ''
    }

    for (let i = 0; i < length; i++) {
      random.num = this.getRandomNum(0, symbols.length)
      random.symbol = symbols[random.num];

      id += random.symbol;
    }

    return id;
  }
}
const randomer = new Randomer();

// чат
class Chat {
  constructor(){
    this.messages = {};
    this.moderators = [];
    this.provider = new firebase.auth.GoogleAuthProvider(); // вынес сюда, чтобы в классе провайдер был доступен везде
    this.refs = {
      msg: firebase.database().ref("messages"), //Сокращение обращения к базе сообщений
      err: firebase.database().ref("errors") //Сокращение обращения к базе ошибок
    }
    this.init(); // в этом методе будет все инициализироваться

    this.loadMessages();
  }
  //Вход через Google
  // этот метод уже нужен, потому что когда ты записывал ошибки в базу, делал это два раза, скопировав один и тот же код
  loginError(error){
    const time = getTimeByTimestamp(Date.now()); // сократил

    //Ловим ошибку и записываем её в базу данных, чтобы потом её исправить
    this.refs.err.push().set({
      code: error.code,
      message: error.message,
      mail: error.email,
      credential: error.credential,
      errorCreatedAt: time.toString(), // привел к строке на всякий случай, вдруг прилетает не строка 
      type: "SignInWithPopup",
    });
  }
  redirectLoginPopup(){
    const auth = firebase.auth();

    auth.signInWithRedirect(this.provider); // this.provider
    auth.getRedirectResult().then(() => { // убрал тут аргумент функции result, ведь ты его не юзал дальше
      console.log("Вход выполнен успешно");
    })
    .catch(this.loginError); // передаю метод сразу, так короче будет (важно передать метод без скобок)
  }
  loginPopup(){
    // перенос на новые строчки:
    firebase
    .auth()
    .signInWithPopup(this.provider) // провайдер теперь доступен через this, так как есть в классе как переменная
    .then(() => { // стрелочная функция
      console.log("Вход выполнен успешно");
    })
    .catch(this.loginError);
  }
  // вот главный метод логина
  login(){
    if(screen.width > 1023) this.popup(); // зашел с компьютера
    else this.redirectPopup(); // не с компьютера
    
    // после регистрации инициализирую пользователя (юзера), потому что после рега, у firebase есть все данные 
    user.init();
  }
  logout(){ // переименовал с exit, потому что более правильно подойдет logout, один "корень" - log
    firebase.auth().signOut();
    window.location.reload();
  }
  loadMessages(){
    this.refs.msg
    .orderByChild("createdAt")
    .limitToLast(50)
    .on("child_added", snapshot => {

      messageList.innerHTML += html;
      messageText.value = '';
      messageList.scrollTop = messageList.scrollHeight;

    }, error => {
      console.error("Ошибка чтения с БД: " + error.code);
    });
  }
  init(){
    // сообщение
    messageForm.sendButton.addEventListener('click', () => {
      const message = {
        id: randomer.getRandomId(12),
        text: messageForm.input.value
      }

      // создаю сообщение когда нажали кнопку отправления у формы
      this.messages[message.id] = new Message(message.id, messageText);
    });

    // пробегаюсь по всем сообщениям и ставлю обработчики на клик по кнопке удаления
    this.messages.forEach(message => {
      const deleteBtn = message.elem.querySelector('.messageDeleteButton');

      deleteBtn.addEventListener('click', () => {
        // message.delete(); // точно не знаю сработает ли этот варинат, поэтому ниже есть второй
        const messageId = deleteBtn.parentElement.id;

        this.messages[messageId].delete(); // нахожу вспомогательный класс сообщения по его id и удаляю
      });
    });
  }
}

const chat = new Chat(); // создаю экземпляр чата

// вспомогательный класс пользователя (юзера)
class User {
  constructor() {
    this.id = this.email; // тут логика не очень правильная (изначально у тебя так было), потом расскажу почему
    this.nickname = '';
    this.email = '';
    this.photo = '';
    this.defaultPhoto = "https://im0-tub-ru.yandex.net/i?id=6513e2393ba9bb3ff9721ef864a1df2d&n=13";
  }
  signed(){
    return firebase.auth().currentUser;
  }
  init() { // инициализация
    if (!this.signed()) return; // если не зарегистрирован, то дальше код в методе init не будет выполняться, а просто пропустится
    
    const fbUser = firebase.auth().currentUser;
    
    this.nickname = fbUser.displayName;
    this.email = fbUser.email;
    this.photo = fbUser.photoURL || this.defaultPhoto;
  }
}
const user = new User(); // потом после регистрации инициализирую юзера, и он сам заполнит свои поля никнейма, почты и т.д.

class Message {
  constructor(id, text){
    this.id = id;
    this.text = text;
    this.elem = document.getElementById(`#msg-#-${this.id}`); // написал getElementById, потому что с querySelector не работал
  }
  send(){
    msgRef.push().set({
      avatar: user.photo,
      name: user.nickname,
      mail: user.email,
      text: messageForm.input.value,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
    });
    messageForm.input.value = '';

    chat.loadMessages();

    return false;
  }
  delete(){
    this.refs.msg.child(this.id).remove(); // удаляю из базы данных

    chat.loadMessages(); // загружаю все сообщения заново
  }
  getHtml(snapshot){
    let html = ``;

    const deleteBtn = ``;
    if ((snapshot.val().mail == user.email) || (moderators.indexOf(user.email)) != -1) {
      deleteBtn = `<button data-id="${this.id}" class="messageDeleteButton"> ✖ </button>`;
    }
    
    html += `
      <div id="msg-#-${this.id}" class="messageContainer">
        <div class="messageInnerSender">${snapshot.val().name}</div>
        <div class="messageCreatedAt">${getTimeByTimestamp(snapshot.val().createdAt)}</div>
        <br>
        <img class="messageInnerAvatar" src="${snapshot.val().avatar}">
        ${deleteBtn}
        <div class="messageInnerText">${snapshot.val().text}</div>
      </div>
    `;

    return html;
  }
}
