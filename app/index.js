import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import minimapModule from 'diagram-js-minimap';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda';

import {
  debounce
} from 'min-dash';

import diagramXML from '../resources/newDiagram.bpmn';

var container = $('#js-drop-zone');
var canvas = $('#js-canvas');
var homePage = true;

var bpmnModeler = new BpmnModeler({
  container: canvas,
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    propertiesPanelModule,
    propertiesProviderModule,
    minimapModule
  ],
  moddleExtensions: {
    camunda: camundaModdleDescriptor
  }
});
container.removeClass('with-diagram');

function createNewDiagram() {
  openDiagram(diagramXML);
}

function openDiagram(xml) {

  bpmnModeler.importXML(xml, function(err) {

    if (err) {
      container
        .removeClass('with-diagram')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-diagram');
        homePage = false;
    }
  });
}

///////// Open Local File /////////

$("#bpmn-file-choose").change(function(){
    var file = this.files[0];
    var reader = new FileReader();

    reader.onloadend = function(e) {
      var xml = e.target.result;
      openDiagram(xml);
    };
    
    reader.readAsText(file);
});

///////// Save /////////

$("#js-save-diagram").click(function(){
    console.log("1. jquery save entered");
    save();
});

function save() {
    saveDiagram(function(err, xml){
        localStorage.setItem('currentFile', xml);
    });
}

///////// Modal /////////

$("#modal-confirm").click(function() {
    createNewDiagram();
    $("#confirmModal .close").click();
});

function confirmUnsaved(){    
    if ($('#confirmModal').is('#confirmModal')) {      
      jQuery.noConflict();
      jQuery('#confirmModal').modal();
    }
}

function saveSVG(done) {
  bpmnModeler.saveSVG(done);
}

function saveDiagram(done) {
  bpmnModeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ////// 

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Parece que estás utilizando un explorador que no soporta "drag and drop".' +
    'Intenta utilizar Chrome, Firefox o Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {
  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();     
    
    if(!homePage)
        confirmUnsaved();
    else
        createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  $('.dropdown-menu a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.removeClass('disabled')
          .addClass('active')
          .attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active')
          .addClass('disabled');
    }
  }

  var exportArtifacts = debounce(function() {

    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  bpmnModeler.on('commandStack.changed', exportArtifacts);
    
    // Full screen mode:  
    $('#full-screen-mode').click(function() {    
        var elem = document.getElementById("body-content"); 

        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
          elem.msRequestFullscreen();
        }    
    });
});