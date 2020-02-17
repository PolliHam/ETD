sap.ui.require([
    "sap/ui/test/Opa5",
    "test/apps/Namespace/pages/Common"
], function (Opa5, Common) {
    "use strict";

    Opa5.extendConfig({
        arrangements: new Common(),
        viewNamespace: "sap.secmon.ui.m.namespace.view."
    });

    sap.ui.require([
        //pages
        "test/apps/Namespace/pages/Namespace",

        //journeys
        "test/apps/Namespace/journeys/NamespaceJourney"
    ], function () {
        // QUnit.start();
    });
});
