angular
  .module('app')
  .factory('Links', function() {
    return {
      get: function() {
        return [
          ["Home", "#/", "home"],
          ["Help", "#/help", "globe"],
          ["Forum", "#/forum", "users"],
          ["Shop", "#/shop", "shopping-cart"],
          ["Community", "#/community", "trophy"],
          ["Inscription", "#/join", "plus-circle"],
          ["Google+", "https://plus.google.com/100001972574561549064", "google-plus-square"],
          ["Facebook", "https://www.facebook.com/chupato.server", "facebook-square"],
          ["YouTube", "https://www.youtube.com/user/ChupatoChannel", "youtube-play"],
          ["Twitter", "https://twitter.com/chupato", "twitter"]
        ];
      }
    };
  })
