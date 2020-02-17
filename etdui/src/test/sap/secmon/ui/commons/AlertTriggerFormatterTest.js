jQuery.sap.require("sap.secmon.ui.commons.AlertTriggerFormatter");

var libUnderTest;

beforeEach(function() {
	libUnderTest =   sap.secmon.ui.commons.AlertTriggerFormatter;
	 
});

afterEach(function() {
});

describe("AlertTriggerFormatter Tests", function(){
	it("alertTriggerShortFormatter with no binding context", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		//oControl.getBindingContext.and.returnValue(null);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "type", "function");
		expect(result).toEqual("");
	});
	it("alertTriggerShortFormatter with a text", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController", "getParent"]);
		oView.getController.and.returnValue(oController);
		
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "type", "function");
		expect(result).toEqual("0 10");
	});

	it("alertTriggerShortFormatter with no threshold", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return null;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "type", "function");
		expect(result).toEqual("0 <unknown threshold>");
	});
	it("alertTriggerShortFormatter an AnomalyPattern and scoreFunction MIN", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "ANOMALY", "MIN");
		expect(result).toEqual("0 10");
		expect(oController.getCommonText).toHaveBeenCalledWith('PEF_minAlShortText');
	});
	it("alertTriggerShortFormatter an AnomalyPattern and scoreFunction MAX", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "ANOMALY", "MAX");
		expect(result).toEqual("0 10");
		expect(oController.getCommonText).toHaveBeenCalledWith('PEF_maxAlShortText');
	});
	it("alertTriggerShortFormatter an AnomalyPattern and scoreFunction AVG", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "ANOMALY", "AVG");
		expect(result).toEqual("0 10");
		expect(oController.getCommonText).toHaveBeenCalledWith('PEF_avgAlShortText');
	});
	it("alertTriggerShortFormatter an AnomalyPattern and scoreFunction OTHER", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerShortFormatter.call(oControl, "ANOMALY", "OTHER");
		expect(result).toEqual("0 10");
		expect(oController.getCommonText).toHaveBeenCalledWith('PEF_anomalyAlShortText');
	});
	it("alertTriggerFormatter no detail paths", function() {
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerFormatter(null, "ANOMALY");
		expect(result).toEqual("");		
	});
	it("alertTriggerFormatter with detail path no binding context", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext"]);
		var context = jasmine.createSpyObj("context", ['getProperty']);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(null);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerFormatter.call(oControl, "/path/toDetails", "ANOMALY");
		expect(result).toEqual("");
		
	});
	it("alertTriggerFormatter with detail path and binding context", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext", "getModel"]);
		var context = jasmine.createSpyObj("context", ['getProperty', 'getModel']);
		var oModel = jasmine.createSpyObj("oModel", ["getObject", "getProperty"]);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		context.getModel.and.returnValue(oModel);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		oModel.getObject.and.returnValue({Name : "Name", Value : "Value"});
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 0;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		oControl.getModel.and.returnValue(oModel);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerFormatter.call(oControl, ["/path/toDetails"], "ANOMALY");
		expect(result).toEqual("0 10");
		
	});
	it("alertTriggerFormatter with detail path and binding context no threshold", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext", "getModel"]);
		var context = jasmine.createSpyObj("context", ['getProperty', 'getModel']);
		var oModel = jasmine.createSpyObj("oModel", ["getObject", "getProperty"]);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.returnValue("{0} {1}");
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		context.getModel.and.returnValue(oModel);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		oModel.getObject.and.returnValue({Name : "Name", Value : "Value"});
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 1;
				break;
			case "Threshold":
				return null;
				break;
			case "Text":
				return "Text";
				break;
			case "PEF_alertText1":
				return "Alert Text";
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		oControl.getModel.and.returnValue(oModel);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerFormatter.call(oControl, ["/path/toDetails"], "ANOMALY");
		expect(result).toEqual("1 <unknown threshold>");
		
	});
	
	it("alertTriggerFormatter with detail path and binding context and identical threshold and value", function() {
		var oControl = jasmine.createSpyObj('oControl', [ "getBindingContext", "getModel"]);
		var context = jasmine.createSpyObj("context", ['getProperty', 'getModel']);
		var oModel = jasmine.createSpyObj("oModel", ["getObject", "getProperty"]);
		var oController = jasmine.createSpyObj('oController', ["getCommonText"]);
		oController.getCommonText.and.callFake(function(property) {
			switch(property) {
			case "PEF_alertText1":
				return "Measure {0} exceeds threshold {1}";
			case "PEF_alertText2":
				return  "For {2} = {3} measure {0} exceeds threshold {1}";
			case "PEF_alertText3":
				return "Measure {0} reaches the threshold {1}";
			case "PEF_alertText4":
				return "For {2} = {3} measure {0} reaches threshold{1}";
			default :
				return "{0} {1}";
			}
		});
		var oView = jasmine.createSpyObj('oView', ["getController"]);
		context.getModel.and.returnValue(oModel);
		oView.getController.and.returnValue(oController);
		spyOn(sap.secmon.ui.commons.AlertTriggerFormatter.uiUtils,"getView").and.returnValue(oView);
		oModel.getObject.and.returnValue({Name : "Name", Value : "Value"});
		context.getProperty.and.callFake(function(property) {
			switch(property) {
			case "Count":
				return 10;
				break;
			case "Threshold":
				return 10;
				break;
			case "Text":
				return "Text";
				break;
			default:
				return "{0} {1}";
			}
		});
		oControl.getBindingContext.and.returnValue(context);
		oControl.getModel.and.returnValue(oModel);
		var result = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerFormatter.call(oControl, ["/path/toDetails"], "ANOMALY");
		expect(result).toEqual("10 10");
		
	});
	
});