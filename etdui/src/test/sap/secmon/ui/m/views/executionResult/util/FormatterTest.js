jQuery.sap.require("sap.secmon.ui.m.views.executionResult.util.Formatter");


describe("executionResult Formatter Tests", function(){
    var libUnderTest;
    var spy, oModel;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.views.executionResult.util.Formatter;
    });

    afterEach(function() {
    });
    beforeEach(function() {
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel",["method","getProperty"]);
    });

    it("assignmentTypeFormatter Formatter", function() {
        oModel.getProperty.and.returnValue("Yes");
        spy.getModel.and.returnValue(oModel);
        expect(libUnderTest.assignmentTypeFormatter.call(spy,"NEW_ALERT")).toEqual("Yes");
        oModel.getProperty.and.returnValue("No");
        expect(libUnderTest.assignmentTypeFormatter.call(spy,"OLD_ALERT")).toEqual("No");
        expect(libUnderTest.assignmentTypeFormatter.call(spy,"ALERT")).toEqual("ALERT");
    });
    
    it("statusFormatter Formatter", function() {
        expect(libUnderTest.statusFormatter()).toEqual("");
        expect(libUnderTest.statusFormatter(null)).toEqual("");
        expect(libUnderTest.statusFormatter("Error")).toEqual("");
        expect(libUnderTest.statusFormatter("Error",null)).toEqual("");
        expect(libUnderTest.statusFormatter("Success", "")).toEqual("Success");
        oModel.getProperty.and.returnValue("ExecutionError {0}");
        spy.getModel.and.returnValue(oModel);
        expect(libUnderTest.statusFormatter.call(spy,"Error", "L/7u3dt10Ea4Vk8W5msgPA==")).toEqual("ExecutionError 2FFEEEDDDB75D046B8564F16E66B203C");
    });
    
    it("executionOutputFormatter Formatter", function() {
        oModel.getProperty.and.returnValue("Alert");
        spy.getModel.and.returnValue(oModel);
        expect(libUnderTest.executionOutputFormatter.call(spy,"ALERT")).toEqual("Alert");
        oModel.getProperty.and.returnValue("Indicator");
        expect(libUnderTest.executionOutputFormatter.call(spy,"INDICATOR")).toEqual("Indicator");
        expect(libUnderTest.executionOutputFormatter("HUGO")).toEqual("Illegal value HUGO");
    });
    
    it("isAlertsOutput Formatter", function() {
        expect(libUnderTest.isAlertsOutput("ALERT", true)).toEqual(true);
        expect(libUnderTest.isAlertsOutput("INDICATOR", false)).toEqual(false);
    });
    
    it("isEventsOutput Formatter", function() {
        expect(libUnderTest.isEventsOutput("INDICATOR")).toEqual(true);
        expect(libUnderTest.isEventsOutput("ALERT")).toEqual(false);
    });
   
});