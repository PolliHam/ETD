jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Formatter");



describe("Anomaly Formatter Tests", function () {
    var libUnderTest;
    var spy, oModel;
    beforeEach(function () {
        libUnderTest = sap.secmon.ui.m.anomaly.ui.Formatter;
    });
    beforeEach(function () {
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel", ["method", "getProperty"]);
    });


    it("enabledFormatter", function () {
        expect(libUnderTest.enabledFormatter(true, false)).toEqual(false);
        expect(libUnderTest.enabledFormatter(true, true)).toEqual(true);
        expect(libUnderTest.enabledFormatter(false,false)).toEqual(false);
        expect(libUnderTest.enabledFormatter(false, true)).toEqual(false);
        expect(libUnderTest.enabledFormatter("Test",false)).toEqual(false);
        expect(libUnderTest.enabledFormatter("Scenario", true)).toEqual(true);
    });

    it("newEnabledFormatter", function () {
        expect(libUnderTest.newEnabledFormatter(true)).toEqual(false);
        expect(libUnderTest.newEnabledFormatter(false)).toEqual(true);
        expect(libUnderTest.newEnabledFormatter(null)).toEqual(true);
        expect(libUnderTest.newEnabledFormatter(undefined)).toEqual(true);
        expect(libUnderTest.newEnabledFormatter("Scenario")).toEqual(true);
        expect(libUnderTest.newEnabledFormatter("Test")).toEqual(false);
    });

    it("iconFormatter", function () {
        expect(libUnderTest.iconFormatter("Pattern")).toEqual("sap-icon://puzzle");
        expect(libUnderTest.iconFormatter("Feature")).toEqual("sap-icon://bar-chart");
        expect(libUnderTest.iconFormatter(null)).toEqual("");
        expect(libUnderTest.iconFormatter(undefined)).toEqual("");
        expect(libUnderTest.iconFormatter("Scenario")).toEqual("sap-icon://upstacked-chart");
        expect(libUnderTest.iconFormatter("Test")).toEqual("");
    });


    it("formatSaveVisiblity", function () {
        expect(libUnderTest.formatSaveVisiblity("Scenario", false, true, true)).toEqual(true);
        expect(libUnderTest.formatSaveVisiblity("Test", false, true, true)).toEqual(false);
        expect(libUnderTest.formatSaveVisiblity("test", null, true, true)).toEqual(true);
        expect(libUnderTest.formatSaveVisiblity(false, true, false, true)).toEqual(true);
        
        expect(libUnderTest.formatSaveVisiblity("Scenario", false, true, false)).toEqual(false);
        expect(libUnderTest.formatSaveVisiblity("Test", false, true, false)).toEqual(false);
        expect(libUnderTest.formatSaveVisiblity("test", null, true, false)).toEqual(false);
        expect(libUnderTest.formatSaveVisiblity(false, true, false, false)).toEqual(false);
    });


    it("formatSaveAsVisiblity", function () {
        expect(libUnderTest.formatSaveAsVisiblity("Test", true)).toEqual(true);
        expect(libUnderTest.formatSaveAsVisiblity(true, true)).toEqual(true);
        expect(libUnderTest.formatSaveAsVisiblity(false, true)).toEqual(true);
        expect(libUnderTest.formatSaveAsVisiblity(null, false)).toEqual(false);
        expect(libUnderTest.formatSaveAsVisiblity("Scenario", true)).toEqual(true);
    });

    it("formatDeleteVisibility", function () {
        expect(libUnderTest.formatDeleteVisibility("Test", true, true)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility(true, true, true)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility("Scenario", true, true)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility("Test", false, true)).toEqual(true);
        expect(libUnderTest.formatDeleteVisibility(null, true, true)).toEqual(false);
        
        expect(libUnderTest.formatDeleteVisibility("Test", true, false)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility(true, true, false)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility("Scenario", true, false)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility("Test", false, false)).toEqual(false);
        expect(libUnderTest.formatDeleteVisibility(null, true, false)).toEqual(false);
    });


    it("formatScenOpVisiblity", function () {
        expect(libUnderTest.formatScenOpVisiblity("Test", true, true)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity("true", true, true)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity("Scenario", true, true)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity("Scenario", false, true)).toEqual(true);
        expect(libUnderTest.formatScenOpVisiblity(null, true, true)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity(undefined, true, true)).toEqual(false);
        
        expect(libUnderTest.formatScenOpVisiblity("Test", true, false)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity("true", true, false)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity("Scenario", true, false)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity("Scenario", false, false)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity(null, true, false)).toEqual(false);
        expect(libUnderTest.formatScenOpVisiblity(undefined, true, false)).toEqual(false);
    });


});