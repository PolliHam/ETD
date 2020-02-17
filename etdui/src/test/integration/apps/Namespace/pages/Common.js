sap.ui.define([
    "sap/ui/test/Opa5",
    // "sap/secmon/ui/m/namespace/localService/mockserver"
], function (Opa5, mockserver) {
    "use strict";

    return Opa5.extend("opa.pages.Namespace.Common", {
        iStartMyApp: function () {
            return this.waitFor({
                success: function () {
                    // mockserver.init();
                    window.opaShell.setApp(new sap.ui.core.ComponentContainer({
                        height: "100%",
                        name: "sap.secmon.ui.m.namespace"
                    }));
                }
            });
        },

        iStopMyApp: function () {
            return this.waitFor({
                success: function () {
                    // mockserver.destroy();
                }
            });
        }
    });
});
