function dragover() {
  //console.log(d3.event);
  d3.event.preventDefault();
}

function dragenter() {
  //console.log(d3.event);
  d3.event.preventDefault();
}

function dragend() {
  //console.log(d3.event);
  d3.event.preventDefault();
}

function drop() {
  var e = d3.event;
  e.preventDefault();

  var dt = e.dataTransfer;
  var files = dt.files;
  console.log(files);
  for (var i = 0; i < files.length; ++i) {
    var file = files[i];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    d3.select(reader).on('loadend', function() {
      var e = d3.event;
      var result = e.currentTarget.result;
      var img = new Image();
      img.src = result;
      d3.select(img)
        .on('load', function() {
          onImageUpdate(img);
        });
    });
  }
  return false;
}

function register() {
  var drop = d3.select('.droppable')
      .on('dragover', dragover)
      .on('dragenter', dragenter)
      .on('dragend', dragend)
      .on('drop', drop);
}

d3.select(window)
  .on('load', register)
  .on('drop', drop);
