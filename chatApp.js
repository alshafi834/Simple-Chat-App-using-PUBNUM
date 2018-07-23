angular.module('chatApp', ['open-chat-framework'])
  .run(['$rootScope', 'ngChatEngine', function($rootScope, ngChatEngine) {
    $rootScope.ChatEngine = ChatEngineCore.create({
      publishKey: 'pub-c-2a45bd82-bab2-444a-9e64-acbc0e6dfa9d',
      subscribeKey: 'sub-c-627c4d32-8d93-11e8-9c3a-c6a250b1bb88'
    }, {
      debug: true,
      globalChannel: 'chat-engine-angular-simple'
    });
    // bind open chat framework angular plugin
    ngChatEngine.bind($rootScope.ChatEngine);

    // set a global array of chatrooms
    $rootScope.chats = [];
  }])
  .controller('chatAppController', function($scope) {
    $scope.ChatEngine.connect(new Date().getTime(), {}, 'auth-key');
    $scope.ChatEngine.on('$.ready', (data) => {
      $scope.me = data.me;



      $scope.me.plugin(ChatEngineCore.plugin['chat-engine-random-username']($scope.ChatEngine.global));


      // when I get a private invit
      $scope.me.direct.on('$.invite', (payload) => {
        let chat = new $scope.ChatEngine.Chat(payload.data.channel);
        chat.onAny((a,b) => {
          console.log(a);
        });
        // create a new chat and render it in DOM
        $scope.chats.push(chat);
      });


      // bind chat to updates
      $scope.chat = $scope.ChatEngine.global;
      $scope.chat.plugin(ChatEngineCore.plugin['chat-engine-online-user-search']({ prop: 'state.username' }));

    });

    $scope.search = function () {
      let found = $scope.chat.onlineUserSearch.search($scope.mySearch);
      // hide every user
      for(let uuid in $scope.chat.users) {
        $scope.chat.users[uuid].hideWhileSearch = true;
      }
      // show all found users
      for(let i in found) {
        $scope.chat.users[found[i].uuid].hideWhileSearch = false;
      }
    }


    // create a new chat
    $scope.newChat = function(user) {
      // define a channel
      let chat = new Date().getTime();
      // create a new chat with that channel
      let newChat = new $scope.ChatEngine.Chat(chat);
      // we need to auth ourselves before we can invite others
      newChat.on('$.connected', () => {
        // this fires a private invite to the user
        newChat.invite(user);
        // add the chat to the list
        $scope.chats.push(newChat);
      });
    };



  })
  .controller('chat', function($scope) {
    // every chat has a list of messages
    $scope.messages = [];
    // send a message using the messageDraft input
    $scope.sendMessage = function () {
      $scope.chat.emit('message', { text: $scope.newMessage });
      $scope.newMessage = '';
    };
    // when this chat gets a message
    $scope.chat.on('message', function(payload) {
      // if the last message was sent from the same user
      payload.sameUser = $scope.messages.length > 0 && payload.sender.uuid == $scope.messages[$scope.messages.length - 1].sender.uuid;
      // if this message was sent by this client
      payload.isSelf = payload.sender.uuid == $scope.me.uuid;
      // add the message to the array
      $scope.messages.push(payload);
    });
  });