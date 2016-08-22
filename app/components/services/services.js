'use strict';

angular.module('services', [])
  .factory('d3Service', ['$document', '$q', '$rootScope', function($document, $q, $rootScope) {
    var d = $q.defer();
    function onScriptLoad() {
      // Load client in the browser
      $rootScope.$apply(function() { d.resolve(window.d3); });
    }
    // Create a script tag with d3 as the source
    // and call our onScriptLoad callback when it
    // has been loaded
    var scriptTag = $document[0].createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.async = false;
    scriptTag.src = 'bower_components/d3/d3.js';

    var scriptTag2 = $document[0].createElement('script');
    scriptTag2.type = 'text/javascript';
    scriptTag2.async = false;
    scriptTag2.src = 'bower_components/d3-tip/index.js';
    scriptTag2.onreadystatechange = function () {
      if (this.readyState === 'complete') { onScriptLoad(); }
    };
    scriptTag2.onload = onScriptLoad;

    var s = $document[0].getElementsByTagName('body')[0];
    s.appendChild(scriptTag);
    s.appendChild(scriptTag2);

    return {
      d3: function() { return d.promise; }
    };
  }])

  // Service to facilitate the data used thoughout the application
  .factory('columnDataService', ['$rootScope', function($rootScope) {
    var columnData = {}; // private variable to store raw data from the JSON file
    var preferencesData = {}; // private variable to store the user preferences for each column

    function getColumnData() {
      return columnData;
    }
    function setColumnData(data) {
      columnData = data;
    }
    function getPreferencesData() {
      return preferencesData;
    }
    function setPreferencesByColumn(name, data) {
      preferencesData[name] = data;
    }

    return {
      getColumnData: getColumnData,
      setColumnData: setColumnData,
      getPreferencesData: getPreferencesData,
      setPreferencesByColumn: setPreferencesByColumn
    };
  }]); 