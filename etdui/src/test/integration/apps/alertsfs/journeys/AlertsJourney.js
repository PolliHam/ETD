sap.ui.define([

], function () {
	"use strict";

	QUnit.module("Alerts view");

	QUnit.moduleStart(function(){
		console.log("Alerts started");
	});

	opaTest("Alerts can be launched in shell", function (Given, When, Then) {
		// Arrangements
		Given.onTheAlertsPage.iStartMyApp();
	});

	QUnit.moduleDone(function(){
		console.log("Alerts finished");
	});

});
