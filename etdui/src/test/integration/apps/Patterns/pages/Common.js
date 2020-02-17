sap.ui.define([
    "sap/ui/test/Opa5",
    "test/sap/secmon/ui/m/patternfs/localService/mockserver"
], function (Opa5, mockserver) {
    "use strict";

    return Opa5.extend("test.pages.Patterns.Common", {
        iStartMyApp: function () {
            return this.waitFor({
                success: function () {
                    mockserver.init();
                    window.opaShell.setApp(new sap.ui.core.ComponentContainer({
                        height: "100%",
                        name: "sap.secmon.ui.m.patternfs"
                    }));
                }
            });
        },

        iStopMyApp: function () {
            return this.waitFor({
                success: function () {
                    mockserver.destroy();
                }
            });
        }
    });
});
