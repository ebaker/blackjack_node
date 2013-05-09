Array.prototype.remove =
  function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  }

var Card = {
  init: function(s, n){
    this.suite = s;
    this.number = n;
  }
}

var Hand = {
  init: function(card1, card2){
    this.cards = new Array();
    this.cards.push(card1);
    this.cards.push(card2);
  },
  add_card: function(card){
    this.cards.push(card);
  },
  is_blackjack: function(){
    var result = false;
    var c = this.cards;
    if (c.length == 2){
      if (c[0].number == 'A' && (c[1].number == '10' || c[1].number == 'J' || c[1].number == 'Q' || c[1].number == 'K')){
      result = true;
      }
      else if (c[1].number == 'A' && (c[0].number == '10' || c[0].number == 'J' || c[0].number == 'Q' || c[0].number == 'K')){
      result = true;
      }
    }
    return result;
  }
}

var Deck = {
  init: function(){
    var deck = new Array();
    var suites = ['hearts','spades','clubs','diamond' ];
    var numbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    for (var x=0; x < suites.length ; x++){
      for (var y=0; y < numbers.length ; y++){
        var card = Object.create(Card);
        card.init(suites[x], numbers[y]);
        deck.push(card);
      } 
    }
    this.deck = deck;
  },
  shuffle: function(iterations){
    for (var i = 0 ; i < iterations ; i++){
      var shuffled_deck = new Array();
      var tmp_deck = this.deck;
      while (tmp_deck.length > 0)
      {
        var pick = Math.floor((Math.random() * tmp_deck.length));
        var tmp_card = tmp_deck[pick];
        shuffled_deck.push(tmp_card);
        tmp_deck.remove(pick);
      }
      this.deck = shuffled_deck;
    }
    
  },
  deal_card: function(){
    var card = this.deck.pop();
    return card;
  }
}

var Game = {
  is_started: false,
  dealer_hand: undefined,
  player_hand: undefined,
  start: function(){
    this.d = Object.create(Deck);
    this.d.init();
    this.d.shuffle(10);
    this.dealer_hand = Object.create(Hand);
    this.player_hand = Object.create(Hand);
    this.dealer_hand.init(this.d.deal_card(), this.d.deal_card());
    this.player_hand.init(this.d.deal_card(), this.d.deal_card());
    // // TEST bj start - artifically give dealer or player BJ
    // var c1 = Object.create(Card);
    // var c2 = Object.create(Card);
    // c1.init("spades", "K");
    // c2.init("clubs", "A");
    // this.player_hand.init(c1, c2);
    // this.dealer_hand.init(c1, c2);
    // // TEST bj end
    this.is_started = true;
  },
  hit_player: function(){
    this.player_hand.add_card( this.d.deal_card());
  },
  hit_dealer: function(){
    this.dealer_hand.add_card( this.d.deal_card());
  },
  get_count: function(tmp_hand){
  var hand_value = 0;
  var num_of_aces = 0;
  for (var i = 0 ; i < tmp_hand.cards.length ; i++)
      {
        var card = tmp_hand.cards[i];
        if (card.number == 'A'){
          num_of_aces++;
        }
        else if(card.number == 'J' ||
                card.number == 'Q' ||
                card.number == 'K'){
          hand_value = parseInt(hand_value) + 10;
        }
        else if (card.number > 1 && card.number < 11){
          hand_value = parseInt(hand_value) + parseInt(card.number);
        }
        else{
          console.log("Error: State should not exist");
          //throw exception
        }     
      }
    // maybe works?
    for (var a = 0; a < num_of_aces; a++){
      if ((hand_value + 11 + (num_of_aces-(a+1))) <= 21){
        hand_value = hand_value + 11;
      }
      else{
        hand_value = hand_value + 1;
      }
    }
    // do something with aces
  return hand_value;
  },
  get_state: function(isStand) {
    var current_state = "waiting";
    var player_count = this.get_count(this.player_hand);
    if (player_count == 21){ // check for black jack
      if (this.dealer_hand.is_blackjack() && this.player_hand.is_blackjack()){
        current_state = "push_on_bj";
        this.is_started = false;
      }
      else if (this.player_hand.is_blackjack()){
        current_state = "black_jack!!!";
        this.is_started = false;
      }
    }
    if (player_count > 21){
      current_state = "you_busted";
      this.is_started = false;
    }
    else if (isStand){
      var dealer_count = this.get_count(this.dealer_hand);
      while (dealer_count < 17){
        this.hit_dealer();
        dealer_count = this.get_count(this.dealer_hand);
      }
      if (dealer_count > 21){
        current_state = "you_win-dealer_busted";
      }
      else{
        if (dealer_count == player_count){
        current_state = "push";          
        }
        else if (dealer_count > player_count){
        current_state = "you_lost";
        }
        else if (dealer_count < player_count){
        current_state = "you_won!";
        }
        else{
          console.log("Error: State should not exist");
          // throw exception
        }
      }
      this.is_started = false;
    }
    // var dealer_count = this.get_count(this.dealer_hand);
    return current_state;
  },
  print: function(isStand){
    var status = {dealer_shows: this.dealer_hand.cards[0],
                 your_hand: this.player_hand,
                 your_count: this.get_count(this.player_hand),
                 game_state: this.get_state(isStand)};
    if (isStand){
      status = {dealer_hand: this.dealer_hand,
                dealer_count: this.get_count(this.dealer_hand),
                your_hand: this.player_hand,
                your_count: this.get_count(this.player_hand),
                game_state: this.get_state(isStand)};   
    }
    
    return status;
  }
}




var game = Object.create(Game);

var express = require('express');
var app = express();

app.get('/new_game', function(req, res){
  game.start();
  var print = game.print(false);
  res.send(print);
});


app.get('/hit', function(req, res){
  var print = "";
  if (game.is_started){
    game.hit_player();
    print = game.print(false);
  }
  else{
    print = {error: "Game not started! Use /new_game to start game first."};
  }
  res.send(print);
});

app.get('/stand', function(req, res){
  var print = "";
  if (game.is_started){
    print = game.print(true);
  }
  else{
    print = {error: "Game not started! Use /new_game to start game first."};
  }
  res.send(print);
});


app.listen(3000);
