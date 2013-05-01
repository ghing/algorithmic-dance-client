(function(){
  // Save a reference to the global object (`window` in the browser, `exports`
  // when using commonJS 
  var root = this;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var AMPKinect;
  if (typeof exports !== 'undefined') {
    AMPKinect = exports;
  } else {
    AMPKinect = root.AMPKinect = {};
  }

  var sources = {
    cosmic: './img/cosmic.png',
    lines_lg: './img/lines_lg.png',
    lines: './img/lines.png',
    red_sample: './img/red_sample.png',
    sample2: './img/sample2.png',
    sample3: './img/sample3.png'
  };

  var images = {};

  function loadImages(sources, callback) {
    var loadedImages = 0;
    var numImages = 0;
    // get num of sources
    for(var src in sources) {
      numImages++;
    }
    for(var src in sources) {
      images[src] = new Image();
      images[src].onload = function() {
        if(++loadedImages >= numImages) {
          callback(images);
        }
      };
      images[src].src = sources[src];
    }
  }

  var Skeleton = Class.extend({
    jointNames: ['SKEL_LEFT_FINGERTIP', 'SKEL_LEFT_ANKLE', 'SKEL_RIGHT_ELBOW', 'SKEL_RIGHT_FOOT', 'SKEL_LEFT_ELBOW', 'SKEL_RIGHT_WRIST', 'SKEL_LEFT_HAND', 'SKEL_RIGHT_HIP', 'SKEL_LEFT_HIP', 'SKEL_LEFT_SHOULDER', 'SKEL_RIGHT_KNEE', 'SKEL_WAIST', 'SKEL_HEAD', 'SKEL_TORSO', 'SKEL_RIGHT_HAND', 'SKEL_LEFT_WRIST', 'SKEL_RIGHT_COLLAR', 'SKEL_RIGHT_ANKLE', 'SKEL_NECK', 'SKEL_RIGHT_FINGERTIP', 'SKEL_LEFT_KNEE', 'SKEL_LEFT_FOOT', 'SKEL_RIGHT_SHOULDER', 'SKEL_LEFT_COLLAR'],

    init: function(opts) {
      this.userId = opts.userId;
      this.joints = {};
      this.initGraphics(opts);
      //this.stage.draw();
    },

    initGraphics: function(opts) {},

    positionJoint: function(name, x, y, z) {
      console.debug("Positioning joint " + name + " at ( " + x + ", " + y + ", " + z + ") for user " + this.userId);
      // From the OpenNI docs:
      //
      // A joint orientation is described by its actual rotation and the 
      // confidence we have in that rotation The first column is the X
      // orientation, where the value increases from left to right. The second
      // column is the Y orientation, where the value increases from bottom to
      // top. The third column is the Z orientation, where the value increases
      // from near to far.
      this.joints[name] = {
          x: x,
          y: y,
          z: z
      };
      
      return this.draw();
    },

    draw: function() {
      return this;
    },

    remove: function() {}
  });


  var UserManager = Class.extend({
    init: function(opts) {
      console.debug("Initializing scene");
      this.users = {};
      this.initGraphics(opts);
    },

    initGraphics: function(opts) {},


    initUser: function(userId) {
      console.debug("Initializing user " + userId);
      return this.users[userId] = new Skeleton({
        userId: userId
      });
    },

    getUser: function(userId) {
      if (typeof this.users[userId] === 'undefined') {
        return this.initUser(userId);
      }
      else {
        return this.users[userId];
      }
    },

    removeUser: function(userId) {
      if (typeof this.users[userId] !== 'undefined') {
        this.users[userId].remove();
        delete this.users[userId];
      }
    }
  });

  var KineticSkeleton = Skeleton.extend({
    initGraphics: function(opts) {
      this.layer = opts.layer;
      this.stage = opts.stage;
      this.shape = new Kinetic.Polygon({
        x: this.stage.getWidth() / 2,
        y: this.stage.getHeight() / 2,
        sides: 5,
        radius: 400,
        fillPatternImage: opts.fillPatternImage,
        stroke: 'none',
        strokeWidth: 4,
        draggable: true
      });
      this.layer.add(this.shape);
    },

    draw: function() {
      if (this.joints['SKEL_TORSO'] &&
          this.joints['SKEL_HEAD'] && this.joints['SKEL_RIGHT_HAND'] && 
          this.joints['SKEL_RIGHT_FOOT'] && this.joints['SKEL_LEFT_FOOT'] &&
          this.joints['SKEL_LEFT_HAND']) {
          // Argument to setPoints orders points clockwise from lower
          // left-hand corner
          var points = [   
            {
              x: this.joints['SKEL_LEFT_FOOT'].x,
              y: this.joints['SKEL_LEFT_FOOT'].y
            },
            {
              x: this.joints['SKEL_LEFT_HAND'].x,
              y: this.joints['SKEL_LEFT_HAND'].y
            },
            {
              x: this.joints['SKEL_HEAD'].x,
              y: this.joints['SKEL_HEAD'].y
            },
            {
              x: this.joints['SKEL_RIGHT_FOOT'].x,
              y: this.joints['SKEL_RIGHT_FOOT'].y
            },
            {
              x: this.joints['SKEL_RIGHT_HAND'].x,
              y: this.joints['SKEL_RIGHT_HAND'].y
            }
          ];
          this.shape.setPoints(points);
          // TODO: Scale the shape so that it gets bigger and smaller the closer
          // or further you move from the kinect controller
          //this.shape.setScale(this.joints['SKEL_HEAD'].z, this.joints['SKEL_HEAD'].z);
          this.stage.draw();
      }

      return this;
    },

    remove: function() {
      this.shape.destroy();
    }
  });

  var KineticUserManager = UserManager.extend({
    getRandomFillPatternImage: function() {
      var images = Object.keys(this.fillPatternImages);
      var image = images[Math.floor(Math.random()*images.length)];
      return this.fillPatternImages[image];
    },

    initGraphics: function(opts) {
      this.fillPatternImages = opts.fillPatternImages;
      this.stage = new Kinetic.Stage({
          container: opts.container,
          //width: window.width,
          //height: window.height
          width: 2000,
          height: 1000
        });
      
      this.layer = new Kinetic.Layer(); 
      this.stage.add(this.layer);
    },

    initUser: function(userId) {
      return this.users[userId] = new KineticSkeleton({
        userId: userId,
        stage: this.stage,
        layer: this.layer,
        fillPatternImage: this.getRandomFillPatternImage() 
      });
    }
  });

  var UserTrackingApp = AMPKinect.UserTrackingApp = Class.extend({
    init: function(opts) {
      opts = opts || {};
      if (typeof opts.socketUrl === "undefined") {
        opts.socketUrl = "ws://localhost:8080/";
      }
      if (typeof opts.container === "undefined") {
        opts.container = "container";
      }
      loadImages(sources, function(images) {
        var users = new KineticUserManager({
          container: opts.container, 
          fillPatternImages: images
        });
        var ws = new WebSocket(opts.socketUrl);
        ws.onmessage = function(e) {
          var data = JSON.parse(e.data);
          if (data.type === 'joint') {
            users.getUser(data.user).positionJoint(data.joint, data.x, data.y, data.z);
          }
          else if (data.type === 'lostUser') {
            users.removeUser(data.user);
          }
        };
      });
    }
  });

  var StupidTestApp = Class.extend({
    init: function(opts) {
      loadImages(sources, function(images) {
        var users = new KineticUserManager({
          container: 'container',
          fillPatternImages: images
        });
        var user = users.getUser(1);
        user.positionJoint('SKEL_TORSO', users.stage.getWidth(), users.stage.getHeight());
        user.positionJoint('SKEL_HEAD', 500, 300, 0);
        user.positionJoint('SKEL_RIGHT_HAND', 1000, 500, 0);
        user.positionJoint('SKEL_RIGHT_FOOT', 500, 900, 0);
        user.positionJoint('SKEL_LEFT_HAND', 100, 500, 0);
        user.positionJoint('SKEL_LEFT_FOOT', 100, 900, 0);
        users.stage.draw();
      });
    }
  });

  AMPKinect.init = function(opts) {
    //var app = new StupidTestApp();
    var app = new UserTrackingApp(); 
  };
}).call(this);
