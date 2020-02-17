/* globals d3 */
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.model.json.JSONModel");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.ux3.Notifier");
jQuery.sap.require("sap.ui.core.Message");
jQuery.sap.require("sap.ui.core.MessageType");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.alertsfs.view.Locations", {

    MIN_RADIUS : 10,
    MAX_RADIUS : 40,
    /**
     * Maximum zoom factor supported by map provider. For MapQuest/OpenStreetMap this would be 16.
     */
    MAX_ZOOM_FACTOR : 16,

    ALERT_SOURCE_TARGET_SERVICE : "/sap/secmon/services/ui/m/alerts/AlertSourceTargetSystems.xsodata/",
    
    
    NORMAL_COLOR: "RGBA(255,000,000,070)",
    COLOR_BORDER: "RGBA(000,000,000,050)",
    COLOR_BORDER_SELECTED: "RGBA(000,000,000,255)",
    SELECTED_COLOR: "RGBA(00,100,155,255)",
    
    MESSAGE_UTIL : null,

    onInit : function() {

        this.applyCozyCompact();
        var view = this.getView();

        // explicitly request JSON format
        this.oDataModel = new sap.ui.model.odata.ODataModel(this.ALERT_SOURCE_TARGET_SERVICE, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        

        /** map with key:system and value: alert count */
        this.systemAlertCountMap = {};
        /**
         * map with key: system and value: geo position string in VB location format: "longitude;latitude;altitude". Caution: VB format does not follow convention of Google etc.: Longitude is listed
         * BEFORE latitude! VB location format: longitude;latitude;altitude Longitude and latitude are geo positions in degree. Longitude: in range [-180, 180] Latitude: in range [-90, 90] Altitude:
         * unused. Set to 0
         */
        this.systemGeoPosition = {};
        
        /**
         * map with key: system value: JS object with attributes - longitude - latitude
         */
        this.systemLongitudeLatitude = {};
        
        /**
         * Determines the frame which is displayed.
         * 
         */
        this.currentGeoData = {
        		zoom: 0,
        		centerLongitude: 0,
        		centerLatitude: 0
        };
        
        
        /**
         * The data displayed in the GeoMap
         */
        var oData = {
                Circles : [],
                Legend : []
            };
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData);
        view.setModel(oModel);
        this.MESSAGE_UTIL = new sap.secmon.ui.commons.GlobalMessageUtil();

        /**
         * The data displayed in notification bar at the bottom
         */
        var oUiData = {
        		alertCountWOLocation : 0
        };
        var oUiModel = new sap.ui.model.json.JSONModel();
        oUiModel.setData(oUiData);
        view.setModel(oUiModel, "uiModel");
    },
    

    onCirclesClick: function(oEvent){
        // Dummy event handler:
        // This event handler must exist so that the event handler below
        // "onSelectSystem" is called
      },
      
    
    /**
     * handler for click on a Legend item
     */
    onSelectSystem: function(oEvent){
        var that = this;
        
    	var system = oEvent.getSource().getBindingContext().getProperty("system");
    	var map = this.getView().byId("vbi");
    	var legendItems = map.getLegend().getItems();
    	legendItems.forEach(function(item){
    	    if (item.getBindingContext().getProperty("system") === system){
    	        item.setColor(that.SELECTED_COLOR);
    	    }else{
    	        item.setColor(that.NORMAL_COLOR);
    	    }
    	});
    	
    	// position at center without zoom
    	var systemLocation = this.systemLongitudeLatitude[system];
    	var currentZoomFactor = this.currentGeoData.zoom;
    	map.zoomToGeoPosition(systemLocation.longitude, systemLocation.latitude, currentZoomFactor);
    	
    	// select
     	var circles = map.getVos()[0].getItems();
     	var theCircle;
      	circles.forEach(function(circle){
      	    
          	if (circle.getBindingContext().getProperty("system") === system){
          	    theCircle = circle;
          	    circle.setColor(that.SELECTED_COLOR);
          	    circle.setLabelBgColor(that.SELECTED_COLOR);
          	    circle.setColorBorder(that.COLOR_BORDER_SELECTED);
          	    circle.focus();
            }else{
                circle.setColor(that.NORMAL_COLOR);
                circle.setLabelBgColor(that.NORMAL_COLOR);
                circle.setColorBorder(that.COLOR_BORDER);
            }
        });
      	
      	// put selected circle to front
      	if (theCircle){
      	  map.getVos()[0].removeItem(theCircle);
      	  map.getVos()[0].addItem(theCircle);
      	  if (oEvent.getSource() === theCircle){
      	      this.openWindow(oEvent);
      	  }
      	}
      	
    },
    

    /**
     * Setter for oDataModel filter. Used by other controllers to dispatch filters. This triggers (re)reading the oData model and therefore (re)drawing the graph.
     * 
     * @param aFilters -
     *            Array of SAPUI5 filter objects.
     */
    setAlertFilters : function(aFilters) {
        this.alertFilters = aFilters;
        this.readOData();
    },

    getAlertFilters : function() {
        return this.alertFilters;
    },

    readOData : function() {
        var controller = this;
        var filters = this.getAlertFilters();

        sap.ui.core.BusyIndicator.show(0);

        // The alert source target service should accept the same filter
        // parameters as the alerts service.
        // This is achieved setting the filters on association "Alert".
        var filtersWithNavigation = filters.map(function(filter) {
            return new sap.ui.model.Filter({
                path : filter.sPath,
                operator : filter.sOperator,
                value1 : filter.oValue1,
                value2 : filter.oValue2,
                and : filter.bAnd
            });
        });
        this.oDataModel.read("AlertData", {
        	urlParameters: {$select: "AlertId,SystemId,SystemLatitude,SystemLongitude,SystemType"},
            filters : filtersWithNavigation,
            success : $.proxy(controller.startGraph, this),
            error : $.proxy(controller.handleLoadingError, this)
        });
    },

    handleLoadingError : function() {
        sap.ui.core.BusyIndicator.hide();
        // on init, the controller does not know its component yet:
        var errorTxt = this.getView().getModel("i18n").getProperty("MConnectedSys_Error");
        var sTitle = this.getView().getModel("i18nCommon").getProperty("Error_TIT");
        sap.m.MessageBox.alert(errorTxt, {
            title : sTitle
        });
    },
    
    
    onBeforeRendering: function(oEvent){
        
        var geoMap = this.getView().byId("vbi"); 
        // Refer to https://scn.sap.com/thread/3841920
        // for URLs of different map providers
        
        var hereMap = {  
                  "MapProvider": [{  
                      "name": "HEREMAPS",  
                      "type": "",  
                      "description": "",  
                      "tileX": "256",  
                      "tileY": "256",  
                      "maxLOD": "19",  
                      "copyright": "Tiles Courtesy of HERE Maps",  
                      "Source": [{  
                              "id": "s1",  
                              "url": "/sap/hana/spatial/mapClient/map.xsjs?level={LOD}&row={Y}&col={X}"
                          }
                      ]  
                  }],  
                  
                      "MapLayerStacks": [{ 
                          "name": "Default", 
                          "MapLayer": {
                              "name": "layer1", 
                              "refMapProvider": "HEREMAPS",
                              "opacity": "1.0", 
                              "colBkgnd": "RGB(255,125,255)" 
                              }
                          }
                    ] 
                };  
        
        geoMap.setMapConfiguration(hereMap);
    },    
    
    /**
     * Event handler for submit event (the submit event seems to be the event when a request is submitted to request map data from map provider?). It is used for Firefox which does not react to zoom
     * when zoom is called within onInit. We need to call it in a delayed manner.
     */
    onSubmit : function(oEvent){
    	
    	if (!this.oldGeoData){
    		this.oldGeoData = {
            		zoom: 0,
            		centerLongitude: 0,
            		centerLatitude: 0
            };
    	}
    	if (this.currentGeoData.zoom !== this.oldGeoData.zoom || 
    		this.currentGeoData.centerLongitude !== this.oldGeoData.centerLongitude ||
    		this.currentGeoData.centerLatitude !== this.oldGeoData.centerLatitude ){
    		
    		this.oldGeoData = this.currentGeoData;
            var geoMap = this.getView().byId("vbi"); 
            geoMap.zoomToGeoPosition(	this.currentGeoData.centerLongitude,
            							this.currentGeoData.centerLatitude, 
            							this.currentGeoData.zoom);    		
    	}
    },

    /**
     * prepare the graph from request response.
     * 
     */
    startGraph : function(response) {
        sap.ui.core.BusyIndicator.hide();
        
        this.systemAlertCountMap = {};
        // Find count of SystemId and fill map object systemLongitudeLatitude
        var controller = this;
        
        // map of {system, alertGUIDs};
        var systemAlertGuidsMap = {};     
        response.results.forEach(function(result) {
            if (result.SystemId === null || result.SystemId === undefined){
                return;
            }
            if (systemAlertGuidsMap[result.SystemId] === undefined) {
                systemAlertGuidsMap[result.SystemId] = {};
            }
            if (result.AlertId) {
                systemAlertGuidsMap[result.SystemId][result.AlertId] = null;
            }
            if (controller.systemGeoPosition[result.SystemId] === undefined && result.SystemLatitude && result.SystemLongitude) {
                controller.systemGeoPosition[result.SystemId] = "" + result.SystemLongitude + ";" + result.SystemLatitude + ";0";
            }
            if (controller.systemLongitudeLatitude[result.SystemId] === undefined && result.SystemLatitude && result.SystemLongitude){
            	controller.systemLongitudeLatitude[result.SystemId] = {longitude: result.SystemLongitude,latitude: result.SystemLatitude, systemType: result.SystemType};
            }
        });
        var system, alertCount, format;
        for (system in systemAlertGuidsMap){
            alertCount = Object.keys(systemAlertGuidsMap[system]).length;
            if (alertCount > 0) {
                this.systemAlertCountMap[system] = alertCount;
            }
        }
        
        // prepare circles for systems with location info, or error messages
        // otherwise
        var systemsWithoutLocations = {};
        var alertGuidsWithoutSystem = {};
        // first loop to get minimum and maximum alert count, used to calculate
        // circle size
        var minCount = 0, maxCount = 1;
        var systemWithMaxCount;
        var sPos;
        for (system in this.systemAlertCountMap) {
            sPos = this.systemGeoPosition[system];
            if (sPos) {
            	if (maxCount < this.systemAlertCountMap[system]){
            		maxCount = this.systemAlertCountMap[system];
            		systemWithMaxCount = system;
            	}
            	if (!minCount || minCount > this.systemAlertCountMap[system]){
            		minCount = this.systemAlertCountMap[system];
            	}
            }
        }
        var sizeFn =  d3.scale.linear().domain([ minCount, maxCount ]).range([ this.MIN_RADIUS, this.MAX_RADIUS ]);
        // second loop to calculate circles
        var oData = {Circles: [], Legend: []};
        for (system in this.systemAlertCountMap) {
            sPos = this.systemGeoPosition[system];
            if (sPos) {
            	alertCount = this.systemAlertCountMap[system];
                // on init, the controller does not know its component yet.
            	// We cannot use this.getText
                format = this.getView().getModel("i18n").getProperty("MAlertsFS_SysAlerts");
                var sMsg = this.i18nText(format, system, alertCount);
                var radiusInPx = sizeFn(alertCount);
                // text size seems to be ignored in 1.28?
                var textSize = 2 * Math.round(Math.sqrt(radiusInPx));
                var systemInfo = this.systemLongitudeLatitude[system]?this.systemLongitudeLatitude[system]:{};
                oData.Circles.push({
                	pos: sPos,
                	system: system,
                	radius: radiusInPx,
                	color: this.NORMAL_COLOR,
                	colorBorder: this.COLOR_BORDER,
                	hotDeltaColor: this.SELECTED_COLOR,
                	labelBgColor: this.NORMAL_COLOR,
                	text: system,
                	textSize: textSize,
                	tooltip: sMsg,
                	systemType: systemInfo.systemType
                });
                oData.Legend.push({
                	system: system,
                	text: system + " (" + alertCount + ")",
                	color: this.NORMAL_COLOR,
                	tooltip: sMsg
                });
            } else {
                systemsWithoutLocations[system] = this.systemAlertCountMap[system];
                for (var alertGuid in systemAlertGuidsMap[system]){
                    alertGuidsWithoutSystem[alertGuid] = null;
                }
                
            }

        }
        
        // Performance: Dispose unneeded objects explicitly
        systemAlertGuidsMap = null;
        
        // sort alphabetically by system
        oData.Legend.sort(function(a, b){
        	return a.system === b.system ? 0: a.system < b.system ? -1 : 1;
        });


        // Geo map beautification: Set initial center and zoom factor
        var longData = this.calcLongitudeDistribution(this.systemLongitudeLatitude);
        var latData = this.calcLatitudeDistribution(this.systemLongitudeLatitude);
        
        // the geoData is processed in event handler onSubmit
        this.currentGeoData = this.calculateZoomFactor(longData, latData);

              
        var model = this.getView().getModel();
        model.setData(oData);
        model.refresh();
        
        // Focus on legend item which has the highest alert count
        if (systemWithMaxCount){
            var map = this.getView().byId("vbi");
            var legendItems = map.getLegend().getItems();
            legendItems.forEach(function(item){
                var systemOfItem = item.getBindingContext().getProperty("system");
                if (systemOfItem === systemWithMaxCount){
                    item.fireClick();
                }
            });            
        }
        
        
        // Calling zoom in onInit only works for Chrome.
        // For Firefox the zoom request in "onInit" is ignored.
        // For it, there is a delayed event handler "onSubmit"
        var geoMap = this.getView().byId("vbi");
        geoMap.zoomToGeoPosition(this.currentGeoData.centerLongitude, this.currentGeoData.centerLatitude, this.currentGeoData.zoom);        
        var aMsgs = [];

        for (system in systemsWithoutLocations){
        	alertCount = systemsWithoutLocations[system];
            // on init, the controller does not know its component yet.
        	// We cannot use this.getText
        	format = this.getView().getModel("i18n").getProperty("MAlertsFS_SysAlerts");
        	var shortText = this.i18nText(format, system, systemsWithoutLocations[system]);
        	
        	var longText = this.getView().getModel("i18n").getProperty("MAlertsFS_NoSysLocLong");
        	aMsgs.push({shortText: shortText, longText: longText, count: alertCount});
        }
        
        // Performance: Dispose unneeded objects explicitly
        systemsWithoutLocations = null;
        
        
        aMsgs.sort(function(a, b){
        	// sort descending by alert count
        	return b.count- a.count;
        });
        maxCount = Object.keys(alertGuidsWithoutSystem).length;
        this.addErrorNotifications(aMsgs, maxCount);
        
        // Performance: Dispose unneeded objects explicitly
        alertGuidsWithoutSystem = null;
    },
    
    
    /**
     * calculate minimum, center, maximum of longitude from several system locations.
     * 
     * @param systemLongPosMap
     *            object with key: system and value: an object with attribute "longitude"
     * @return an object with attributes: - center: the center of system positions (longitude only in degrees) - minimum: minimum system position (in degrees) - maximum: maximum system position (in
     *         degrees)
     */
    calcLongitudeDistribution: function(systemLongPosMap){
    	var aSystems = Object.keys(systemLongPosMap);
    	if (aSystems.length === 0){
    		return {
    			minimum: 0,
    			center: 0,
    			maximum: 0 };
    	}
    	var firstLongPos = +systemLongPosMap[aSystems[0]].longitude;
    	if (aSystems.length === 1){
    		return {
    			minimum: firstLongPos,
    			center: firstLongPos,
    			maximum: firstLongPos}; 
    	}
    	// Switch coordinate system:
    	// Rotate longitudinal coordinates so that the first system lies on
        // origin
    	var rotatedLongitudes = [];
    	var rotatedMin, rotatedMax;
    	for (var system in systemLongPosMap){
    		var absLong = systemLongPosMap[system].longitude;
    		var rotatedLong = this.calcLongitudinalDistance(absLong, firstLongPos);
    		if ((rotatedMin === undefined) || (rotatedMin > rotatedLong)){
    			rotatedMin = rotatedLong;
    		}
    		if ((rotatedMax === undefined) || (rotatedMax < rotatedLong)){
    			rotatedMax = rotatedLong;
    		}    		
    		rotatedLongitudes.push(rotatedLong);
    	}
    	// calc. geom. center
    	var rotatedCenter = rotatedMin + (rotatedMax - rotatedMin)/2;
    	
    	// Switch back to original coordinate system
    	var absoluteCenter = this.calcLongitudinalDistance(rotatedCenter, -firstLongPos);
    	var absoluteMin = this.calcLongitudinalDistance(rotatedMin, -firstLongPos);
    	var absoluteMax = this.calcLongitudinalDistance(rotatedMax, -firstLongPos);
    	return {
    		minimum: absoluteMin,
    		center: absoluteCenter,
    		maximum: absoluteMax
    	};
    },
    

    /**
     * calculate maximum, minimum, center of latitude for several system locations.
     * 
     * @param systemLatPosMap
     *            object with key: system and value: an object with attribute "latitude"
     * @return an object with attributes: - center: the center of system positions (latitude only in degrees) - minimum: minimum system position (in degrees) - maximum: maximum system position (in
     *         degrees)
     */
    calcLatitudeDistribution: function(systemLatPosMap){
    	var min, max;
    	var aSystems = Object.keys(systemLatPosMap);
    	if (aSystems.length === 0){
    		return {
    			minimum: 0,
    			center: 0,
    			maximum: 0 };
    	}
    	for (var system in systemLatPosMap){
    		var lat = +systemLatPosMap[system].latitude;
    		if (!min || min > lat){
    			min = lat;
    		}
    		if (!max || max < lat){
    			max = lat;
    		}    		
    	} 	
    	// calculate geom. center
    	return {
    			center: min + (max- min)/2,
    			minimum: min,
    			maximum: max}; 
    },
    
    /**
     * calculate the longitudinal distance between 2 positions (in degrees)
     * 
     * @param long
     *            number position in degrees, between [-180, 180]
     * @param long2
     *            number position in degrees, between [-180, 180]
     * @return the distance between the 2 positions, taking into account the sign switch at the date line: + 180 becomes - 180, and vice versa.
     */
    calcLongitudinalDistance: function(long1, long2){
    	var dist = long1 - long2;
    	if (dist > 180){
    		dist -= 360;
    	}
    	if (dist < -180){
    		dist += 360;
    	}
    	return dist;
    },
    
    
    /**
     * calculate zoom factor from geo boundaries. The geo boundaries include minimum longitude, maximum longitude, minimum latitude, maximum latitude. They set the boundaries for an area that should
     * be zoomed into.
     * 
     * @param longBoundary
     *            an object with fields maximum and minimum
     * @param latBoundary
     *            an objct with fields maximum and minimum
     * @return object with fields: { zoom: zoomFactor, // integer between 0 and 16 centerLongitude: // integer between -180 and 180 centerLatitude: // integer between -90 and 90 }
     */
    calculateZoomFactor : function(longBoundary, latBoundary){
    	
    	// Zoom factor: The zoom factor values are dependent on Map provider.
    	// For OpenStreetMap/ MapQuest they range between
    	// 0 (full globus shown in one single tile)
    	// 16 (Streets are visible. In this case, the maximum number of tiles is
        // given by formula Math.pow(2, 2*16)
    	var MAX_TILE_COUNT = 65536; // maximum number of tiles along x or y axis
    	var MIN_DISTANCE_IN_TILES = 1/MAX_TILE_COUNT;    
    	
    	// Check if there is no system circle
    	if (longBoundary.center === 0 &&
    		longBoundary.maximum === 0 &&
    		longBoundary.minimum === 0 &&
    		latBoundary.center === 0 &&
    		latBoundary.maximum === 0 &&
    		latBoundary.minimum === 0){
    		return {zoom: 0,
    		        centerLongitude: 0,
    		        centerLatitude: 0};
    		
    	}
    	
    	// The map UI control has a minimum width and width.
    	// The map automagically fits in several tiles, each tile has a size of
        // 256*256 pixels²,
    	// we do no need to consider size of UI control.
    	// Example: If the UI control has a width of 700px then at least 4x4
        // tiles are
    	// needed. I.e. the used zoom factor is 2 (even if the configured zoom
        // factor is 0).

    	
    	// We have to convert spherical coordinates into Cartesian coordinates,
    	// Maps use the Mercator projection for that.
    	// Longitude is converted into x axis, latitude is converted into y
        // axis.
    	// Refer to
        // https://developer.here.com/rest-apis/documentation/enterprise-map-tile/topics/key-concepts.html
    	var longDistance = this.calcLongitudinalDistance(longBoundary.maximum, longBoundary.minimum);
    	var fractionX = Math.max( longDistance/360, MIN_DISTANCE_IN_TILES);
    	var zoomX = Math.floor( -Math.log(fractionX) * Math.LN2);

    	var latMaxRadians = latBoundary.maximum * Math.PI / 180;
    	var latMinRadians = latBoundary.minimum * Math.PI / 180;
    	
    	var yMax = Math.log( Math.tan( Math.PI/4 + latMaxRadians/2 ) ) / Math.PI;
    	var yMin = Math.log( Math.tan( Math.PI/4 + latMinRadians/2 ) ) / Math.PI;
    	var yCenter = yMin + (yMax - yMin)/2;
    	var latCenterDegrees = (360 / Math.PI * Math.atan(Math.exp(yCenter * Math.PI))) - 90;
    	var fractionY = Math.max( (yMax - yMin, MIN_DISTANCE_IN_TILES) );
    	var zoomY = Math.floor( - Math.log(fractionY) * Math.LN2);

    	var zoom = Math.min(zoomX, zoomY);
    	// Just to be sure, allow more space around circles so that circles are
    	// displayed complete.
    	zoom = Math.max(0, zoom - 1);
    	
        return {zoom: zoom,
            centerLongitude: longBoundary.center,
            centerLatitude: latCenterDegrees};
    },
    
    
    /**
     * add error texts to notification bar
     * 
     * @param list
     *            of text objects. Attributes: shortText and longText.
     */
    addErrorNotifications: function(aTexts, alertCountWOLocation){	
// var alertCountWOLocationText =
// this.alertWithoutLocationsFormatter(alertCountWOLocation);
// var oUiData = { notifications: [],
// alertCountWOLocation: alertCountWOLocationText};
    	var that = this;
    	aTexts.forEach(function(oText){
    	    that.MESSAGE_UTIL.addMessage(sap.ui.core.MessageType.Warning, oText.shortText, oText.longText);
    		// oUiData.notifications.push({
    		// type: sap.ui.core.MessageType.Error,
    		// title: oText.shortText,
    		// description: oText.longText
    		// });
    	}); 
    	// var model = this.getView().getModel("uiModel");
    	// model.setData(oUiData);
    	// this.getView().byId("footerBar").setVisible(aTexts.length>0);
    },
    
    alertWithoutLocationsFormatter : function(alertCount) {
        // on init, the controller does not know its component yet.
    	// We cannot use this.getText
	    var textTemplate = this.getView().getModel("i18n").getProperty("MAlertsFS_NoSysLocation");
	    return this.i18nText(textTemplate, alertCount);
    },
        
        
    /**
     * Callback for VBM internal event "openWindow".
     */
    onOpenWindow: function(oEvent){
        var circleDialogContent = this._getCircleDialogContent();
        circleDialogContent.placeAt(oEvent.getParameter("contentarea").id,'only');
    },
    
    /**
     * Open a popup window at the clicked circle. VBM does not follow SAPUI standards, we cannot use a sap.m.Popover. We need to open the VBM internal popup, and fill its content via event
     * "openWindow". Refer to https://sapui5.hana.ondemand.com/test-resources/sap/ui/vbm/bestpractices.html
     */
    openWindow: function(oEvent){
        
        var oCircle = oEvent.getSource();
        var context = oCircle.getBindingContext(); 
        var circleDialogContent = this._getCircleDialogContent();
        circleDialogContent.setBindingContext(context);
        
        var tooltip = context.getProperty("tooltip");
        oCircle.openDetailWindow(tooltip);
        var oMap =  oCircle.getParent().getParent();
        oMap.attachEventOnce("openWindow", this.onOpenWindow, this);    
    },
    
    _getCircleDialogContent : function() {
        if (!this.circleDialogContent) {
            this.circleDialogContent = sap.ui.xmlfragment("sap.secmon.ui.m.alertsfs.view.LocationsCircleDialog", this);
            this.circleDialogContent.setModel(this.getView().getModel());
            this.circleDialogContent.setModel(this.getView().getModel("i18n"), "i18n");
            this.getView().addDependent(this.circleDialogContent);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.circleDialogContent);
        return this.circleDialogContent;
    }
    

});
