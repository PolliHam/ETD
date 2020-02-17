jQuery.sap.require("sap.secmon.ui.m.alertsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");


describe("alertsfs Formatter Tests", function(){
    var libUnderTest;
    var spy, oModel;


    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.alertsfs.util.Formatter;
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel",["method","getProperty"]);
    });
      
    it("statusDropdownEnablementFormatter Formatter", function() {
        expect(libUnderTest.statusDropdownEnablementFormatter("INVESTIG_TRIGGERED")).toEqual(false);
        expect(libUnderTest.statusDropdownEnablementFormatter("EXCLUDED_EXCEPTION")).toEqual(false);
        expect(libUnderTest.statusDropdownEnablementFormatter("OPEN")).toEqual(true);
    });
    
    it("InvestigationCountFormatter Formatter", function() {
        expect(libUnderTest.InvestigationCountFormatter(0)).toEqual(false);
        expect(libUnderTest.InvestigationCountFormatter(1)).toEqual(true);
    });
    
    it("triggeringTextWithLinksFormatter", function(){
       var triggerText = "triggerText";
       spyOn(sap.secmon.ui.commons.AlertTriggerFormatter, "alertTriggerFormatter").and.returnValue(triggerText);
       spyOn(sap.secmon.ui.m.alerts.util.Formatter, "eventAsLinkFormatter").and.callFake(function(measureContext) {
           switch(measureContext) {
           case "LOG":
               return true;
           default:
               return false;
           }
       });
       
       
       var aDetailPaths = [];
       expect(libUnderTest.triggeringTextWithLinksFormatter(aDetailPaths, "FLAB", "LOG")).toEqual(triggerText + " ({0})");
       expect(libUnderTest.triggeringTextWithLinksFormatter(aDetailPaths, "FLAB", "ALERT")).toEqual(triggerText);
       expect(libUnderTest.triggeringTextWithLinksFormatter(aDetailPaths, "ANOMALY", "LOG")).toEqual(triggerText);
       expect(libUnderTest.triggeringTextWithLinksFormatter(aDetailPaths, "ANOMALY", "ALERT")).toEqual(triggerText);
    });
    
    
    it("triggeringEventLinksFormatter", function(){
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var triggerText = "triggerText";
        spyOn(sap.secmon.ui.commons.AlertTriggerFormatter, "alertTriggerFormatter").and.returnValue(triggerText);
        spyOn(sap.secmon.ui.m.alerts.util.Formatter, "eventAsLinkFormatter").and.callFake(function(measureContext) {
            switch(measureContext) {
            case "LOG":
                return true;
            default:
                return false;
            }
        });

        expect(libUnderTest.triggeringEventLinksFormatter("ANOMALY", "ALERT", "1234")).toEqual([]);
        expect(libUnderTest.triggeringEventLinksFormatter("FLAB", "ALERT", "1234")).toEqual([]);
        
        var actual;
        actual = libUnderTest.triggeringEventLinksFormatter("ANOMALY", "LOG", "1234", "Events"); 
        expect(actual.length).toEqual(1);
        expect(actual[0].Text).toEqual("Events");
        expect(actual[0].Url).toContain("alert="+ CommonFunctions.base64ToHex("1234"));
        
        actual = libUnderTest.triggeringEventLinksFormatter("FLAB", "LOG", "1234", "Events");
        expect(actual.length).toEqual(1);
        expect(actual[0].Text).toEqual("Events");
        expect(actual[0].Url).toContain("alert="+ CommonFunctions.base64ToHex("1234"));
     });
    
});