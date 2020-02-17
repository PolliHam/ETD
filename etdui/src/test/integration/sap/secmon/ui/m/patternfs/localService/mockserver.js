sap.ui.define([
    "sap/ui/core/util/MockServer"
], function (MockServer) {
    "use strict";

    var _sMockDataPath = "test/sap/secmon/ui/m/patternfs/localService";

    var aMockServers = [];
    var aEndpoints = [
        "/sap/secmon/services/patterndefinitionToAlerts.xsodata/",
        "/sap/secmon/services/ui/m/patterns/WorkspacePatternDefinition.xsodata/",
        "/sap/secmon/services/ConfigurationParameters.xsodata/",
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
        },

        destroy: function () {
            aMockServers.forEach(function (mock) {
                mock.destroy();
            });
        }
    };
});
