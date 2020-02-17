jQuery.sap.require("sap.secmon.ui.m.systems.util.Formatter");


describe("Systems Formatter Tests", function(){
    var libUnderTest;
    var spy, oModel;
    
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.systems.util.Formatter;
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel",["method", "getProperty"]);
    });
        
    it("systemTypeFormatter", function() {
        expect(libUnderTest.systemTypeFormatter("ABAP")).toEqual("ABAP");
        expect(libUnderTest.systemTypeFormatter("JAVA")).toEqual("Java");
    });
        
});