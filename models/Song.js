var mongoose = require('mongoose');

var SongSchema = new mongoose.Schema({
  name: String,
  status: {type: String, enum: ['Lyrics', 'Arragement', 'Publish', 'Done']},
  lyrics: String,
  descriptions: String,
  followUp: String,
  oldLyrics: [String],
  songwriter: [String],
  lyricswriter: [String],
  singer: [String],
  folderUrl: String,
  audioUrls: [{url: String, description: String, sequence: Number}],
  videoUrls: [String],
  gatherings: Number,
  composeDate: Date,
  lyricsDate: Date,
  arrangedDate: Date,
  tags: [String],
  createUid: String,
  updateUid: String,
  comments: [{createUid: String, body: String, createdAt: Date}]
}, {timestamps: true});

// ref: http://stackoverflow.com/questions/30743565/how-to-save-userid-in-mongoose-hook
SongSchema.virtual('uid').set(function (userId) {
  //if (this.isNew()) {
  if(!this.createUid) {
    this.createUid = this.updateUid = userId;
  } else {
    this.updateUid = userId;
    
    //Update create_uid of comments if it is null
    this.comments.forEach(function(el)
    {
        if(!el.createUid)   el.createUid = userId; 
    });
  }
});

/*
SongSchema.pre('save', function(next){
  var userId = req.session.user
  this.updateUid = now;
  if ( !this.createUid ) {
    this.createUid = now;
  }
  next();
});
*/

module.exports = mongoose.model('Song', SongSchema);
