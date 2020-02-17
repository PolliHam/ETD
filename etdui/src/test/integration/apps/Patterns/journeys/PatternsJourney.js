sap.ui.define([

], function () {
    "use strict";

    QUnit.module("Patterns view");

    QUnit.moduleStart(function(){
        console.log("Patterns started");
    });

    opaTest("Patterns can be launched in shell", function (Given, When, Then) {
        // Arrangements
        Given.onThePatternsPage.iStartMyApp();
        // Assertions
        Then.onThePatternsPage.iShouldSeePage();
        Then.onThePatternsPage.iShouldSeeList();
        Then.onThePatternsPage.iShouldSeeFilterBar();
    });

    opaTest("PatternSelectDialog works", function (Given, When, Then) {
        When.onThePatternsPage.iPressPatternSelectDialog();
        Then.onThePatternsPage.iShouldSeePatternSelectDialog();

        When.onThePatternsSelectDialog.iEnterTextInSearch();
        Then.onThePatternsSelectDialog.iShouldSeeSearchResult();

        When.onThePatternsSelectDialog.iSelectedTwoItemsAndPressedOk();
        Then.onThePatternsPage.iShouldSeeTwoItemsInMultiInput();
    });

    opaTest("Patterns search works", function (Given, When, Then) {
        When.onThePatternsPage.iPressGo();
        Then.onThePatternsPage.iShouldSeeSearchResult();
    });

    QUnit.moduleDone(function(){
        console.log("Patterns finished");
    });

});
