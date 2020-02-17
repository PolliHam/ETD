sap.ui.define([
    "sap/ui/core/util/MockServer"
], function (MockServer) {
    "use strict";

    var aMockServers = [];
    var _sMockDataPath = "test/sap/secmon/ui/m/commons/localService";

    return {
        init: function () {
            //oData services
            var sJsonFilesUrl = jQuery.sap.getModulePath(_sMockDataPath + "/data/");
            var sMetadataUrl = jQuery.sap.getModulePath(_sMockDataPath + "/metadata", ".xml");


            var oMockServer = new MockServer({
                rootUri: "/sap/secmon/services/genericEnum.xsodata/"
            });

            oMockServer.simulate(sMetadataUrl, {
                sMockdataBaseUrl: sJsonFilesUrl,
                bGenerateMissingMockData: true
            });
            oMockServer.start();
            aMockServers.push(oMockServer);


            //xsjs services
            var aRequests = [{
                method: "GET",
                path: "/Enum(.*)",
                response: function (oXhr) {
                    oXhr.respondJSON(200, null,
                        jQuery.sap.syncGetJSON(jQuery.sap.getModulePath(_sMockDataPath + "/data/Enum", ".json")));
                }
            }];
            var oMockServer = new MockServer({
                rootUri: "/sap/secmon/services/genericEnum.xsodata",
                requests: aRequests
            });
            oMockServer.start();
            aMockServers.push(oMockServer);


            var aRequests = [{
                method: "GET",
                path: "/ConfigurationParameters(.*)/ValueInteger",
                response: function (oXhr) {
                    oXhr.respondJSON(200, null, JSON.stringify({"d":{"ValueInteger":30}}));
                }
            }];
            var oMockServer = new MockServer({
                rootUri: "/sap/secmon/services/ConfigurationParameters.xsodata",
                requests: aRequests
            });
            oMockServer.start();
            aMockServers.push(oMockServer);



            var aRequests = [{
                method: "GET",
                path: "/texts/EnumTextBundle.hdbtextbundle(.*)",
                response: function (oXhr) {
                    oXhr.respondJSON(200, null,
                        jQuery.sap.syncGet(jQuery.sap.getModulePath(_sMockDataPath + "/data/EnumTextBundle", ".hdbtextbundle")));
                }
            },
                {
                    method: "GET",
                    path: "/ui/m/namespace/i18n/UIText.hdbtextbundle(.*)",
                    response: function (oXhr) {
                        oXhr.respondJSON(200, null,
                            jQuery.sap.syncGet(jQuery.sap.getModulePath(_sMockDataPath + "/data/UIText", ".hdbtextbundle")));
                    }
                },
                {
                    method: "GET",
                    path: "/ui/CommonUIText.hdbtextbundle(.*)",
                    response: function (oXhr) {
                        oXhr.respondJSON(200, null,
                            jQuery.sap.syncGet(jQuery.sap.getModulePath(_sMockDataPath + "/data/CommonUIText", ".hdbtextbundle")));
                    }
                }];
            var oMockServer = new MockServer({
                rootUri: "/sap/secmon",
                requests: aRequests
            });
            oMockServer.start();
            aMockServers.push(oMockServer);
        },

        destroy: function () {
            aMockServers.forEach(function (mock) {
                mock.destroy();
            });
        }
    };
});
