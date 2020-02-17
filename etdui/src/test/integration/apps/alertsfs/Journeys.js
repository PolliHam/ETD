sap.ui.require([
	"sap/ui/test/Opa5",
	"test/apps/alertsfs/pages/Common"
], function (Opa5, Common) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "sap.secmon.ui.m.alertsfs.view."
	});

	sap.ui.require([
		//pages
		"test/apps/alertsfs/pages/Alerts",
		"test/apps/alertsfs/pages/Common",

		//journeys
		"test/apps/alertsfs/journeys/AlertsJourney"
	], function () {
		// QUnit.start();
	});
});
