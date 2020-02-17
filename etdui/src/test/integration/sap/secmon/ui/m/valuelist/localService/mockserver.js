sap.ui.define([
    "sap/ui/core/util/MockServer"
], function (MockServer) {
    "use strict";

    var _sMockDataPath = "sap/secmon/ui/m/patternfs/localService";

    var aMockServers = [];
    var aEndpoints = [
        "/sap/secmon/services/patterndefinitionToAlerts.xsodata/",
        "/sap/secmon/services/ui/m/patterns/WorkspacePatternDefinition.xsodata/",
        "/sap/secmon/services/patternExecutionResult.xsodata/",
        "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata/"
    ];

    return {
        init: function () {
            //oData services
            var sJsonFilesUrl = jQuery.sap.getModulePath(_sMockDataPath + "/data/");
            var sMetadataUrl = jQuery.sap.getModulePath(_sMockDataPath + "/metadata", ".xml");

            aMockServers = aEndpoints.map(function (uri) {
                var oMockServer = new MockServer({
                    rootUri: uri
                });

                oMockServer.simulate(sMetadataUrl, {
                    sMockdataBaseUrl: sJsonFilesUrl,
                    bGenerateMissingMockData: true
                });

                oMockServer.start();
                return oMockServer;
            });




            var ValueListText = "";
            this._loadTextBundle(CommonUIText, "/main/sap/secmon/ui/m/patternfs/localService/data/UIText.hdbtextbundle");

            var aRequests = [
                {
                    method: "GET",
                    path: "/texts/EnumTextBundle.hdbtextbundle(.*)",
                    response: function (oXhr) {
                        oXhr.respondJSON(200, null, EnumTextBundle);
                    }
                },
                {
                    method: "GET",
                    path: "/ui/m/valuelist/i18n/UIText.hdbtextbundle(.*)",
                    response: function (oXhr) {
                        oXhr.respondJSON(200, null, valueListText);
                    }
                },
                {
                    method: "GET",
                    path: "/ui/m/namespace/i18n/UIText.hdbtextbundle(.*)",
                    response: function (oXhr) {
                        oXhr.respondJSON(200, null, UIText);
                    }
                },
                {
                    method: "GET",
                    path: "/ui/CommonUIText.hdbtextbundle(.*)",
                    response: function (oXhr) {
                        oXhr.respondJSON(200, null, UIText);
                    }
                }
            ];
            var oMockServer = new MockServer({
                rootUri: "/sap/secmon",
                requests: aRequests
            });
            oMockServer.start();

        },

        destroy: function () {
            aMockServers.forEach(function (mock) {
                // mock.destroy();
            });
        }
    };
});