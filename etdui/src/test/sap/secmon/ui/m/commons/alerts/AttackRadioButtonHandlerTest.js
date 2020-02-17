jQuery.sap.require("sap.secmon.ui.m.commons.alerts.AttackRadioButtonHandler");

describe("AttackRadioButtonHandler", function() { 
    var libUnderTest;
    
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.commons.alerts.AttackRadioButtonHandler;
    });
    
    it("getOnlyAllowedAttackValue", function() {
        expect(libUnderTest.getOnlyAllowedAttackValue("FALSE_POSITIVE")).toBe("NO");
        expect(libUnderTest.getOnlyAllowedAttackValue("NO_REACTION_NEEDED")).toBe("NO");
        expect(libUnderTest.getOnlyAllowedAttackValue("NO_REACTION_NEEDED_T")).toBe("NO");
        expect(libUnderTest.getOnlyAllowedAttackValue("COMPLETED")).toBe();
    });
    
    it("attackRadioButtonsEnablerPopup", function() {
        expect(libUnderTest.attackRadioButtonsEnablerPopup("NO", "FALSE_POSITIVE",true)).toBe(true);
        expect(libUnderTest.attackRadioButtonsEnablerPopup("NO", "NO_REACTION_NEEDED",true)).toBe(true);
        expect(libUnderTest.attackRadioButtonsEnablerPopup("NO", "NO_REACTION_NEEDED_T",true)).toBe(true);
        expect(libUnderTest.attackRadioButtonsEnablerPopup("YES", "FALSE_POSITIVE",true)).toBe(false);
        expect(libUnderTest.attackRadioButtonsEnablerPopup("YES", "NO_REACTION_NEEDED",true)).toBe(false);
        expect(libUnderTest.attackRadioButtonsEnablerPopup("YES", "NO_REACTION_NEEDED_T",true)).toBe(false);
        
        expect(libUnderTest.attackRadioButtonsEnablerPopup("YES", "INVESTIG_TRIGGERED",true)).toBe(true);
        
        expect(libUnderTest.attackRadioButtonsEnablerPopup("","",false)).toBe(false);
    });
    
    it("attackRadioButtonsEnabler", function() {
        expect(libUnderTest.attackRadioButtonsEnabler("NO", "FALSE_POSITIVE")).toBe(true);
        expect(libUnderTest.attackRadioButtonsEnabler("NO", "NO_REACTION_NEEDED")).toBe(true);
        expect(libUnderTest.attackRadioButtonsEnabler("NO", "NO_REACTION_NEEDED_T")).toBe(true);
        expect(libUnderTest.attackRadioButtonsEnabler("YES", "FALSE_POSITIVE")).toBe(false);
        expect(libUnderTest.attackRadioButtonsEnabler("YES", "NO_REACTION_NEEDED")).toBe(false);
        expect(libUnderTest.attackRadioButtonsEnabler("YES", "NO_REACTION_NEEDED_T")).toBe(false);
        expect(libUnderTest.attackRadioButtonsEnabler("YES", "INVESTIG_TRIGGERED")).toBe(true);
    });
    
});