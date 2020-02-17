jQuery.sap.require("sap.secmon.ui.m.semanticEventFS.utils.Formatter");


describe("semanticEventFS Formatter Tests", function(){
	var libUnderTest;

	beforeEach(function() {
		libUnderTest = sap.secmon.ui.m.semanticEventFS.utils.Formatter;
	});

	afterEach(function() {
	});
	beforeEach(function() {
		spy = jasmine.createSpyObj("controller", ["getModel"]);
		oModel = jasmine.createSpyObj("oModel",["method", "getProperty"]);
		enumServiceSpy = spyOn(sap.secmon.ui.m.alerts.util.Formatter.oEnumService, "getEnumValue");
	});
	var spy, oModel, enumServiceSpy;
	it("userSummarizer with initiating user", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("User");
		
		var result = libUnderTest.userSummarizer.call(spy, "User1", undefined, undefined, undefined);
		
		expect(result).toBe("User1 (User)");
		expect(oModel.getProperty).toHaveBeenCalledWith("InitiatingCOL");
	});
	it("userSummarizer with acting user", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("User");
		
		var result = libUnderTest.userSummarizer.call(spy, undefined, "User1", undefined, undefined);
		
		expect(result).toBe("User1 (User)");
		expect(oModel.getProperty).toHaveBeenCalledWith("ActingCOL");
	});
	it("userSummarizer with targeted user", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("User");
		
		var result = libUnderTest.userSummarizer.call(spy, undefined, undefined, "User1", undefined);
		
		expect(result).toBe("User1 (User)");
		expect(oModel.getProperty).toHaveBeenCalledWith("TargetedCOL");
	});
	it("userSummarizer with targeting user", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("User");
		
		var result = libUnderTest.userSummarizer.call(spy, undefined, undefined, undefined, "User1");
		
		expect(result).toBe("User1 (User)");
		expect(oModel.getProperty).toHaveBeenCalledWith("TargetingCOL");
	});
	it("userSummarizer with two users", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("Role");
		
		var result = libUnderTest.userSummarizer.call(spy, "User1", "User2", undefined, undefined);
		
		expect(result).toBe("User1 (Role), User2 (Role)");
		expect(oModel.getProperty).toHaveBeenCalledWith("InitiatingCOL");
		expect(oModel.getProperty).toHaveBeenCalledWith("ActingCOL");
	});
	
	it("systemSummarizer with initiating system", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("system");
		
		var result = libUnderTest.systemSummarizer.call(spy, "system1", "ABAP", undefined, undefined, undefined, undefined, undefined, undefined);
		
		expect(result).toBe("system1(ABAP) (system)");
		expect(oModel.getProperty).toHaveBeenCalledWith("ActorCOL");
	});
	it("systemSummarizer with acting system", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("system");
		
		var result = libUnderTest.systemSummarizer.call(spy, undefined, undefined, "system1", "ABAP", undefined, undefined, undefined, undefined);
		
		expect(result).toBe("system1(ABAP) (system)");
		expect(oModel.getProperty).toHaveBeenCalledWith("InitiatorCOL");
	});
	it("systemSummarizer with targeted system", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("system");
		
		var result = libUnderTest.systemSummarizer.call(spy, undefined, undefined, undefined, undefined, "system1", "ABAP", undefined, undefined);
		
		expect(result).toBe("system1(ABAP) (system)");
		expect(oModel.getProperty).toHaveBeenCalledWith("IntermediaryCOL");
	});
	it("systemSummarizer with targeting system", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("system");
		
		var result = libUnderTest.systemSummarizer.call(spy, undefined, undefined, undefined, undefined, undefined, undefined, "system1", "ABAP");
		
		expect(result).toBe("system1(ABAP) (system)");
		expect(oModel.getProperty).toHaveBeenCalledWith("ReportingCOL");
	});
	it("systemSummarizer with two systems", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("Role");
		
		var result = libUnderTest.systemSummarizer.call(spy, "system1", "ABAP", "system2","ABAP", undefined, undefined, undefined, undefined);
		
		expect(result).toBe("system1(ABAP) (Role), system2(ABAP) (Role)");
		expect(oModel.getProperty).toHaveBeenCalledWith("ActorCOL");
		expect(oModel.getProperty).toHaveBeenCalledWith("InitiatorCOL");
	});
	
});