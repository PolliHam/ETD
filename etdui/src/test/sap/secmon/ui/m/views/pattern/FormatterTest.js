jQuery.sap.require("sap.secmon.ui.m.views.pattern.Formatter");


describe("pattern Formatter Tests", function(){
    var libUnderTest;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.views.pattern.Formatter;
    });

    afterEach(function() {
    });
    beforeEach(function() {
    });



    it("frequencyVisibility Formatter", function() {
        expect(libUnderTest.frequencyVisibility("SCHDL","FLAB")).toEqual(true);
        expect(libUnderTest.frequencyVisibility("SCHDL","ANOMALY")).toEqual(false);
    });
    
    it("isFLABPattern Formatter", function() {
        expect(libUnderTest.isFLABPattern("FLAB")).toEqual(true);
        expect(libUnderTest.isFLABPattern("ANOMALY")).toEqual(false);
    });
    
    it("numberFormatter Formatter", function() {
        expect(libUnderTest.numberFormatter()).toEqual(0);
        expect(libUnderTest.numberFormatter(0)).toEqual(0);
        expect(libUnderTest.numberFormatter(1)).toEqual(1);
    });

    it("testMode Formatter", function() {
        expect(libUnderTest.testMode("TRUE")).toEqual(true);
        expect(libUnderTest.testMode("FALSE")).toEqual(false);
    });

    it("tagEditableFormatter Formatter", function() {
        expect(libUnderTest.tagEditableFormatter(1)).toEqual(true);
        expect(libUnderTest.tagEditableFormatter("1")).toEqual(false);
        expect(libUnderTest.tagEditableFormatter()).toEqual(false);
        expect(libUnderTest.tagEditableFormatter("something")).toEqual(false);
    });

    it("isAlertPattern Formatter", function() {
        expect(libUnderTest.isAlertPattern("ALERT")).toEqual(true);
        expect(libUnderTest.isAlertPattern("EVENT")).toEqual(false);
    });
    
    it("displayIconTabBar Formatter", function() {
        expect(libUnderTest.displayIconTabBar(true)).toEqual(true);
        expect(libUnderTest.displayIconTabBar(false, "ALERT")).toEqual(true);
        expect(libUnderTest.displayIconTabBar(false, "EVENT")).toEqual(false);
    });
    
    it("showExecuteButton Formatter", function() {
        expect(libUnderTest.showExecuteButton("FLAB")).toEqual(true);
        expect(libUnderTest.showExecuteButton("ANOMALY")).toEqual(false);
    });
      
    it("setLineType Formatter", function() {
        expect(libUnderTest.setLineType(true)).toEqual("Navigation");
        expect(libUnderTest.setLineType(false)).toEqual("Inactive");
    });

    it("tagNameFormatter Formatter", function() {
        expect(libUnderTest.tagNameFormatter("tagName", "tagNamespace")).toEqual("tagName (tagNamespace)");
        expect(libUnderTest.tagNameFormatter("tagName''", "tagNamespace")).toEqual("tagName'' (tagNamespace)");
    });

});