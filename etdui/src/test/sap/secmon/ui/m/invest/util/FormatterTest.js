jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");


describe("invest Formatter Tests", function(){
    var libUnderTest;
    var spy, oModel;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.invest.util.Formatter;
    });

    afterEach(function() {
    });
    beforeEach(function() {
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel",["method", "getProperty"]);
    });
    
       
    it("Title Formatter", function() {
        expect(libUnderTest.titleFormatter(7,{keyValueMap: {   HIGH:"High",
                                                                LOW:"Low",
                                                                MEDIUM:"Medium",
                                                                VERY_HIGH:"Very High" 
                                                            }
                                              }, "MEDIUM")).toEqual("7 (Medium)");
    });
    it("RemoveAlertActionVisibility linkenabled false", function () {
        expect(libUnderTest.removeAlertActionVisibility(false, "OPEN", false, false)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, "OPEN", false, false)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, "OPEN", true, false)).toEqual(true);
        expect(libUnderTest.removeAlertActionVisibility(true, "COMPLETED", false, false)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, undefined, false, false)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, null, false, false)).toEqual(false);
    });
    it("RemoveAlertActionVisibility linkenabled false", function () {
        expect(libUnderTest.removeAlertActionVisibility(false, "OPEN", true, true)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, "OPEN", true, true)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, "COMPLETED", true, true)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, undefined, true, true)).toEqual(false);
        expect(libUnderTest.removeAlertActionVisibility(true, null, true, true)).toEqual(false);
    });
    it("reopenVisibleFormatter", function() {
        expect(libUnderTest.reopenVisibleFormatter("COMPLETED",false)).toEqual(false);
        expect(libUnderTest.reopenVisibleFormatter("COMPLETED",true)).toEqual(true);
        expect(libUnderTest.reopenVisibleFormatter("OPEN",true)).toEqual(false);
    });
    it("editVisibleFormatter", function () {
        expect(libUnderTest.editVisibleFormatter("COMPLETED", true, true)).toEqual(false);
        expect(libUnderTest.editVisibleFormatter("OPEN", true, false)).toEqual(false);
        expect(libUnderTest.editVisibleFormatter("OPEN", true, true)).toEqual(true);
    });
    it("objectType Formatter with unknown object", function() {
        spy.getModel.and.returnValue(oModel);
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"UNKNOWN")).toBeUndefined();
    });
    it("objectType Formatter with Alert", function() {
        spy.getModel.and.returnValue(oModel);
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"ALERT")).toEqual("Text");
        expect(oModel.getProperty).toHaveBeenCalledWith("MInvest_ObjAlert");
    });
    it("objectType Formatter with Event", function() {
        spy.getModel.and.returnValue(oModel);
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"EVENT")).toEqual("Text");
        expect(oModel.getProperty).toHaveBeenCalledWith("MInvest_ObjEvent");
    });
    it("objectType Formatter with Snapshot", function() {
        spy.getModel.and.returnValue(oModel);
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"SNAPSHOT")).toEqual("Text");
        expect(oModel.getProperty).toHaveBeenCalledWith("MInvest_ObjSnap");
    });
    it("objectType Formatter with Healthcheck", function() {
        spy.getModel.and.returnValue(oModel);
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"HEALTHCHECK")).toEqual("Text");
        expect(oModel.getProperty).toHaveBeenCalledWith("MInvest_ObjHealth");
    });
    it("objectType Formatter with Fspace", function() {
        spy.getModel.and.returnValue(oModel);
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"FSPACE")).toEqual("Text");
        expect(oModel.getProperty).toHaveBeenCalledWith("MInvest_ObjFSpace");
    });
   
    it("objectType Formatter invalid model", function() {
       
        oModel.getProperty.and.returnValue("Text");
        expect(libUnderTest.objectTypeFormatter.call(spy,"HEALTHCHECK")).toEqual("HEALTHCHECK");
        expect(oModel.getProperty).not.toHaveBeenCalled();
    });
    it("objectNavigationLinkEnabledFormatter with false displayMode and healthcheck", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(false, "HEALTHCHECK")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with false displayMode and event ", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(false, "EVENT")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with undefined displayMode and healthcheck", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(undefined, "HEALTHCHECK")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with undefined displayMode and event", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(undefined, "EVENT")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with undefined displayMode and alert", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(undefined, "ALERT")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with false displayMode and event", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(false, "ALERT")).toBeFalsy();
    });
     it("objectNavigationLinkEnabledFormatter with true displayMode and healthcheck", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(true, "HEALTHCHECK")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with true displayMode and event ", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(true, "EVENT")).toBeFalsy();
    });
    it("objectNavigationLinkEnabledFormatter with true displayMode and alert ", function() {
        expect(libUnderTest.objectNavigationLinkEnabledFormatter(true, "ALERT")).toBeTruthy();
    });
    it("nameFormatter with ALERT", function() {
       expect(libUnderTest.nameFormatter("Name", "ALERT", "Bla")).toEqual("Name (Bla)");
    });
    it("nameFormatter with HEALTHCHECK", function() {
       expect(libUnderTest.nameFormatter("Name", "HEALTHCHECK", "Bla")).toEqual("Name");
    });
    it("iconFormatter for Alert", function() {
        expect(libUnderTest.iconFormatter("ALERT")).toEqual("sap-icon://alert");
    });
    it("iconFormatter for Event", function() {
        expect(libUnderTest.iconFormatter("EVENT")).toEqual("sap-icon://Fiori4/F0576");
    });
    it("iconFormatter for Healthcheck", function() {
        expect(libUnderTest.iconFormatter("HEALTHCHECK")).toEqual("sap-icon://electrocardiogram");
    });
    it("iconFormatter for FSpace", function() {
        expect(libUnderTest.iconFormatter("FSPACE")).toEqual("sap-icon://folder");
    });
   it("iconFormatter for SNAPSHOT", function() {
        expect(libUnderTest.iconFormatter("SNAPSHOT")).toEqual("sap-icon://add-photo");
    });
    it("iconFormatter for unknown", function() {
        expect(libUnderTest.iconFormatter("UNKNOWN")).toEqual("");
    });
    it("columnListItemTypeFormatter for alert", function() {
        expect(libUnderTest.columnListItemTypeFormatter("ALERT") ).toEqual("Inactive");
    });
    it("columnListItemTypeFormatter for event", function() {
        expect(libUnderTest.columnListItemTypeFormatter("EVENT") ).toEqual("Inactive");
    });
    it("columnListItemTypeFormatter for fspace", function() {
        expect(libUnderTest.columnListItemTypeFormatter("FSPACE") ).toEqual("Navigation");
    });
    it("columnListItemTypeFormatter for healthcheck", function() {
        expect(libUnderTest.columnListItemTypeFormatter("HEALTHCHECK") ).toEqual("Inactive");
    });
    it("columnListItemTypeFormatter for snapshot", function() {
        expect(libUnderTest.columnListItemTypeFormatter("SNAPSHOT") ).toEqual("Inactive");
    });
    it("displayStartTriggerEventsJobFormatter alertCount 0, COMPLETED and true", function() {
        expect(libUnderTest.displayStartTriggeringEventsJobFormatter(0,"COMPLETED", true)).toEqual(false);
    });
    it("displayStartTriggerEventsJobFormatter alertCount 1, COMPLETED and true", function() {
        expect(libUnderTest.displayStartTriggeringEventsJobFormatter(1,"COMPLETED", true)).toEqual(true);
    });
    it("displayStartTriggerEventsJobFormatter alertCount 0, OPEN and true", function() {
        expect(libUnderTest.displayStartTriggeringEventsJobFormatter(0,"OPEN", true)).toEqual(false);
    });
    it("displayStartTriggerEventsJobFormatter alertCount 1, OPEN and true", function() {
        expect(libUnderTest.displayStartTriggeringEventsJobFormatter(0,"OPEN", true)).toEqual(false);
    });
    it("displayStartTriggerEventsJobFormatter alertCount 10, COMPLETED and false", function() {
        expect(libUnderTest.displayStartTriggeringEventsJobFormatter(10,"COMPLETED", false)).toEqual(false);
    });
    describe('objectLinkFormatter', function() {
        beforeEach(function() {
           spyOn(sap.secmon.ui.m.commons.NavigationService, 'alertURL');
           spyOn(sap.secmon.ui.m.commons.NavigationService, 'snapshotURL');
           spyOn(sap.secmon.ui.m.commons.NavigationService, 'casefileURL');
        });
        it("For Alert", function() {
            libUnderTest.objectLinkFormatter ('1234', "ALERT");
            expect(sap.secmon.ui.m.commons.NavigationService.alertURL).toHaveBeenCalledWith('1234');
        });
        it("For Snapshot", function() {
            libUnderTest.objectLinkFormatter ('1234', "SNAPSHOT");
            expect(sap.secmon.ui.m.commons.NavigationService.snapshotURL).toHaveBeenCalledWith('1234');
        });
        it("For Casefile", function() {
            libUnderTest.objectLinkFormatter ('1234', "FSPACE");
            expect(sap.secmon.ui.m.commons.NavigationService.casefileURL).toHaveBeenCalledWith('1234');
        });
        it("For different",function() {
            libUnderTest.objectLinkFormatter ('1234', "EVENT");
            expect(sap.secmon.ui.m.commons.NavigationService.casefileURL).not.toHaveBeenCalled();
            expect(sap.secmon.ui.m.commons.NavigationService.snapshotURL).not.toHaveBeenCalled();
            expect(sap.secmon.ui.m.commons.NavigationService.alertURL).not.toHaveBeenCalled();
        });
    });
    describe('commentIconFormatter', function() {
        it('Comment', function() {
            expect(libUnderTest.commentIconFormatter('COMMENT')).toBe('sap-icon://notes') ;
        });
        it('Ticket', function() {
            expect(libUnderTest.commentIconFormatter('TICKET')).toBe('sap-icon://tags');
        });
        it('Different', function() {
            expect(libUnderTest.commentIconFormatter('BLBLA')).toBe('sap-icon://hint');
        });
    });
    describe('commentTitleFormatter', function() {
        it('Comment', function() {
            expect(libUnderTest.commentTitleFormatter ('COMMENT', 'commentText', 'changedText')).toBe('commentText') ;
        });
        it('Change', function() {
            expect(libUnderTest.commentTitleFormatter ('CHANGE', 'commentText', 'changedText')).toBe('changedText') ;
        });
        it('Different', function() {
            expect(libUnderTest.commentTitleFormatter ('BLBLA', 'commentText', 'changedText')).toBe('BLBLA');
        });
        
    });
});