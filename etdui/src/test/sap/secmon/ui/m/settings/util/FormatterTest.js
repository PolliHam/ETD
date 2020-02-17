jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");


describe("util Formatter Tests", function(){
    var libUnderTest;
    var spy, oTextModel;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.settings.util.Formatter;
    });

    afterEach(function() {
    });
    beforeEach(function() {
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oTextModel = jasmine.createSpyObj("oModel",["method", "getProperty"]);
    });
    
    
    it("formatEventCount", function() {
        spy.getModel.and.returnValue(null);
        expect(libUnderTest.formatEventCount.call(spy,17)).toEqual(17);
        spy.getModel.and.returnValue(oTextModel);
        oTextModel.getProperty.and.callFake(function(text) {
            return "{0} and {1} are green";
        });
        expect(libUnderTest.formatEventCount.call(spy,17, "u")).toEqual("17 and u are green");
    });
    
    it("formatEventCount no unit", function() {
        spy.getModel.and.returnValue(oTextModel);
        oTextModel.getProperty.and.callFake(function(text) {
            return "{0} is green";
        });
        expect(libUnderTest.formatEventCount.call(spy,17)).toEqual("17 is green");
    });

    it("formatLabel", function() {
        expect(libUnderTest.formatLabel("Hallo")).toEqual("Hallo:");
        expect(libUnderTest.formatLabel(undefined)).toEqual("");
        expect(libUnderTest.formatLabel(null)).toEqual("");
    });
    
    it("formatMandatoryLabel", function() {
        expect(libUnderTest.formatMandatoryLabel(undefined)).toEqual("");
        expect(libUnderTest.formatMandatoryLabel(null)).toEqual("");
        expect(libUnderTest.formatMandatoryLabel("Hallo", false)).toEqual("Hallo:");
        expect(libUnderTest.formatMandatoryLabel("Hallo", true)).toEqual("*Hallo:");
    });
    
    it("formatBooleanToString", function() {
        expect(libUnderTest.formatBooleanToString(true)).toEqual("True");
        expect(libUnderTest.formatBooleanToString(false)).toEqual("False");
    });
    
    it("formatBooleanString", function() {
        expect(libUnderTest.formatBooleanString()).toEqual(false);
        expect(libUnderTest.formatBooleanString("")).toEqual(false);
        expect(libUnderTest.formatBooleanString("True")).toEqual(true);
    });
    
    it("getHost", function() {
        expect(libUnderTest.getHostFromUrl("https://123456.sap.corp:4300/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad")).toEqual("123456.sap.corp");
        expect(libUnderTest.getHostFromUrl("://123456.sap.corp:4300/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad")).toEqual("://123456.sap.corp");
        expect(libUnderTest.getHostFromUrl(":123456.sap.corp")).toEqual(":123456.sap.corp");
     });

});