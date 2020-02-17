var ADependencies = [ "sap/secmon/ui/commons/CommonFunctions", "sap/ui/model/odata/CountMode" ];

sap.ui.define(ADependencies, function(CommonFunctions, CountMode) {
    "use strict";
    /**
     * Custom function to provide a helper object for navigation to a URL with parameters. expirationTime: time in seconds
     * 
     * @see:
     */
    var commonFunctions = new CommonFunctions();

    // Constructor
    sap.secmon.ui.commons.NavigationHelper = function(expirationTime) {
        // Navigation model
        this.model = new sap.ui.model.odata.ODataModel("/sap/secmon/services/navigation.xsodata", {
            json : true,
            defaultCountMode : CountMode.Inline
        });
        this.expirationTime = expirationTime;
    };

    // sender
    // Currently there exist 3 parameters which are coded in JSON
    // { "url": url, "data": data, "newWindow": newWindow}
    sap.secmon.ui.commons.NavigationHelper.prototype.navigate = function(param, fnSuccess, fnError) {

        function generateGUID() {
            return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }).toUpperCase();
        }

        var oEntry = {
            Id : commonFunctions.hexToBase64(generateGUID()),
            CreatedAt : commonFunctions.formatDateTime(new Date()),
            URLSource : window.location.href,
            URLTarget : param.url,
            SerializedData : JSON.stringify(param.data),

            ExpiredAt : commonFunctions.formatDateTime(new Date(Date.now() + this.expirationTime * 1000)),
        };

        // create an entry in the table
        this.model.create("/Navigation", oEntry, null, function(oData, response) {
            // redirect to the new URI
            var sUrl = param.url + "?nid=" + commonFunctions.base64ToHex(oData.Id);
            if (param.newWindow === true) {
                window.open(sUrl);
            } else {
                window.location = sUrl;
            }
            fnSuccess(oData);

        }, function(oError) {
            fnError(oError);
        });

    };

    // receiver
    sap.secmon.ui.commons.NavigationHelper.prototype.onNavigated = function(id, fnSuccess, fnError) {
        if (id) {
            this.model.read("/Navigation(X'" + id + "')", {
                success : function(data) {
                    fnSuccess(data);
                    // var oParameter = data.SerializedData;
                    // console.log('session data: ' + JSON.stringify(oParameter));
                },
                error : function(oError) {
                    fnError(oError);
                }
            });
        }
    };

    // sender:
    // - generate entry in navigation table having an unique id and data required by receiver
    // - only id needs to be passed as URL query parameter
    sap.secmon.ui.commons.NavigationHelper.prototype.setNavigation = function(param, fnSuccess, fnError) {

        function generateGUID() {
            return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }).toUpperCase();
        }

        var oEntry = {
            Id : commonFunctions.hexToBase64(generateGUID()),
            URLSource : window.location.href,
            URLTarget : param.url,
            SerializedData : JSON.stringify(param.data),
            ExpiredAt : commonFunctions.formatDateTime(new Date(Date.now() + this.expirationTime * 1000)),
        };

        // create an entry in the table
        this.model.create("/Navigation", oEntry, null, function(oData, response) {
            fnSuccess(commonFunctions.base64ToHex(oData.Id));
        }, function(oError) {
            fnError(oError);
        });
    };
    // receiver:
    // gets relevant data by id
    sap.secmon.ui.commons.NavigationHelper.prototype.getNavigation = function(id, fnSuccess, fnError) {
        if (id) {
            this.model.read("/Navigation(X'" + id + "')", {
                success : function(data) {
                    fnSuccess(data.SerializedData);
                },
                error : function(oError) {
                    fnError(oError);
                }
            });
        }
    };

    return sap.secmon.ui.commons.NavigationHelper;
});