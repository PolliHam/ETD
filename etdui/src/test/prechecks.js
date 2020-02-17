describe("Prechecks for test environment", function(){

	it("has correct locale", function() {
		// Formatter Tests for dates/times rely on the locale being en_US
		var oLocale = sap.ui.getCore().getConfiguration().getLocale();
		expect(oLocale.getLanguage()).toBe("en");
		expect(oLocale.getRegion()).toBe("US");
	});

});