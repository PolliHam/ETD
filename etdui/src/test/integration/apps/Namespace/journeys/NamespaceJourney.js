sap.ui.define([

], function () {
    "use strict";

    QUnit.module("Namespace List");
    QUnit.moduleStart(function(){
        console.log("Namespace started");
    });


    opaTest("Should see page and master list with all entries", function (Given, When, Then) {
        Given.onTheNamespacePage.iStartMyApp();

        Then.onTheNamespacePage.iShouldSeePage();
        Then.onTheNamespacePage.iShouldSeeList();

        Then.onTheNamespacePage.iStopMyApp();
    });

    QUnit.moduleDone(function(){
        console.log("Namespace finished");
    });
});
