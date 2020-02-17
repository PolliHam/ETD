jQuery.sap.require("sap.secmon.ui.m.commons.invest.AttackRadioButtonHandler");

describe("AttackRadioButtonHandler", function() {   
    
    var libUnderTest;
    
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.commons.invest.AttackRadioButtonHandler;
    });
    it("isRequired", function() {
        expect(libUnderTest.isRequired("TEST")).toBe(false);
        expect(libUnderTest.isRequired("COMPLETED")).toBe(true);
    });
});