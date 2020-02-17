sap.ui.require([
    "sap/ui/test/Opa5",
    "test/apps/Patterns/pages/Common"
], function (Opa5, Common) {
    "use strict";

    Opa5.extendConfig({
        arrangements: new Common(),
        viewNamespace: "sap.secmon.ui.m.patternfs.view."
    });

    sap.ui.require([
        //pages
        "test/apps/Patterns/pages/Patterns",
        "test/apps/Patterns/pages/PatternSelectDialog",

        //journeys
        "test/apps/Patterns/journeys/PatternsJourney"
    ], function () {
        // QUnit.start();
    });
});
