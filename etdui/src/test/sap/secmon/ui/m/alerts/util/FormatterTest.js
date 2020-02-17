jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");


describe("Alert Formatter Tests", function(){
	var libUnderTest;

	beforeEach(function() {
		libUnderTest = sap.secmon.ui.m.alerts.util.Formatter;
		spy = jasmine.createSpyObj("controller", ["getModel"]);
		oModel = jasmine.createSpyObj("oModel",["method", "getProperty"]);
		enumServiceSpy = spyOn(sap.secmon.ui.m.alerts.util.Formatter.oEnumService, "getEnumValue");
	});
	var spy, oModel, enumServiceSpy;
	
	
	it("Severity Formatter with no enum service", function() {
		expect(libUnderTest.severityFormatter.call(spy,"HIGH")).toEqual("HIGH");
	});
	it("Severity Formatter with enum service", function() {
		enumServiceSpy.and.returnValue("LOW");
		spy.getModel.and.returnValue(oModel);
		expect(libUnderTest.severityFormatter.call(spy,"HIGH")).toEqual("LOW");
		expect(enumServiceSpy).toHaveBeenCalled();
	});
	it("statusFormatter with no model", function() {
		expect(libUnderTest.statusFormatter.call(spy,"OPEN")).toEqual("OPEN");
	});
	
	it("statusFormatter with no model", function() {
		enumServiceSpy.and.returnValue("Open");
		spy.getModel.and.returnValue(oModel);		
		expect(libUnderTest.statusFormatter.call(spy,"OPEN")).toEqual("Open");
		expect(enumServiceSpy).toHaveBeenCalled();		
	});
	it("createOutputIfFormatter with no model", function() {
		expect(libUnderTest.createOutputIfFormatter.call(spy,"Output")).toEqual("Output");
	});
	
	it("createOutputIfFormatter with no model", function() {
		enumServiceSpy.and.returnValue("No");
		spy.getModel.and.returnValue(oModel);		
		expect(libUnderTest.createOutputIfFormatter.call(spy,"Output")).toEqual("No");
		expect(enumServiceSpy).toHaveBeenCalled();		
	});
	it("attackFormatter with no model", function() {
		expect(libUnderTest.attackFormatter.call(spy,"ATTACK")).toEqual("ATTACK");
	});
	
	it("attackFormatter with no model", function() {
		enumServiceSpy.and.returnValue("Attack");
		spy.getModel.and.returnValue(oModel);		
		expect(libUnderTest.attackFormatter.call(spy,"ATTACK")).toEqual("Attack");
		expect(enumServiceSpy).toHaveBeenCalled();		
	});
	it("alertTitleFormatter", function() {
		var result = libUnderTest.alertTitleFormatter.call(spy, "Title", "HIGH");
		
		expect(typeof result).toEqual("string");
		expect(result).toContain("Title");
		expect(result).toContain("HIGH");
	});
	
	it("eventSourceFormatter with Log", function() {
		spy.getModel.and.returnValue(oModel);
		var result = libUnderTest.eventSourceFormatter.call(spy, "Log", "Event");
		expect(result).toEqual("Event");
		expect(spy.getModel).not.toHaveBeenCalled();
	});
	it("eventSourceFormatter with Alert check", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.eventSourceFormatter.call(spy, "Alert", "Event", "Alert");
		expect(result).toEqual("Alert");
		expect(spy.getModel).not.toHaveBeenCalled();
	});
	it("eventSourceFormatter with Health check", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.eventSourceFormatter.call(spy, "HealthCheck", "Event", "Alert", "Health Check");
		expect(result).toEqual("Health Check");
		expect(spy.getModel).not.toHaveBeenCalled();
	});
	it("eventSourceFormatter with Other", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.eventSourceFormatter.call(spy, "Other", "Event", "Alert", "Health Check");
		expect(result).toEqual("Other");
		expect(spy.getModel).not.toHaveBeenCalled();
	});
	it("methodFormatter no model", function() {
		var result = libUnderTest.methodFormatter.call(spy, "BINARY");
		expect(result).toEqual("BINARY");
	});
	it("methodFormatter with BINARY", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Binary");
		var result = libUnderTest.methodFormatter.call(spy, "BINARY");
		expect(result).toEqual("Binary");
		expect(propertySpy).toHaveBeenCalledWith("MobAlert_NewOcc");
	});
	it("methodFormatter wrong method", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Binary");
		var result = libUnderTest.methodFormatter.call(spy, "Alert");
		expect(result).toEqual("Binary");
		expect(propertySpy).toHaveBeenCalledWith("MobAlert_AnomGaussDistr");
	});
	
	it("isAnomalyEventTrendLinkFormatterw with null", function() {
		expect(libUnderTest.isAnomalyEventTrendLinkFormatter(null)).toBeFalsy();
	});
	it("isAnomalyEventTrendLinkFormatterw with null", function() {
		expect(libUnderTest.isAnomalyEventTrendLinkFormatter(undefined)).toBeTruthy();
	});
	it("isAnomalyEventTrendLinkFormatterw with null", function() {
		expect(libUnderTest.isAnomalyEventTrendLinkFormatter(0)).toBeTruthy();
	});
	it("isTriggeringEventsVisible with null", function() {
		expect(libUnderTest.isTriggeringEventsVisible(null)).toBeFalsy();
	});
	it("isTriggeringEventsVisible with null", function() {
		expect(libUnderTest.isTriggeringEventsVisible(undefined)).toBeTruthy();
	});
	it("isTriggeringEventsVisible with null", function() {
		expect(libUnderTest.isTriggeringEventsVisible(0)).toBeTruthy();
	});
	it("textFormatter with value null", function() {
		expect(libUnderTest.textFormatter(null)).toBe("null");
	});
	it("textFormatter with value null and non zero", function() {
		expect(libUnderTest.textFormatter(null, "other")).toBe("null");
	});
	it("textFormatter with value undefined", function() {
		expect(libUnderTest.textFormatter(undefined)).toBe("null");
	});
	it("textFormatter with non null", function() {
		expect(libUnderTest.textFormatter(2)).toBe("2");
	});
	it("textFormatter with non null and additional null", function() {
		expect(libUnderTest.textFormatter(2, null)).toBe("2");
	});
	it("textFormatter with non null and additional undefined", function() {
		expect(libUnderTest.textFormatter(2, undefined)).toBe("2");
	});
	it("textFormatter with non null and additional", function() {
		expect(libUnderTest.textFormatter("2", "2")).toBe("2 (2)");
	});

	it("event as linkFormatter for Log", function() {
		expect(libUnderTest.eventAsLinkFormatter("Log", "ANOMALY")).toBeTruthy();
	});
	it("eventAsLinkFormatter for HealthCheck", function() {
		expect(libUnderTest.eventAsLinkFormatter("Health", "ANOMALY")).toBeFalsy();
	});
	it("affectedSystemAsLinkFormatter in display Mode with string", function() {
		expect(libUnderTest.affectedSystemAsLinkFormatter(true, "Link")).toBeTruthy();
	});
	it("affectedSystemAsLinkFormatter in display Mode with no string", function() {
		expect(libUnderTest.affectedSystemAsLinkFormatter(true, 2)).toBeFalsy();
	});
	it("affectedSystemAsLinkFormatter in edit Mode with string", function() {
		expect(libUnderTest.affectedSystemAsLinkFormatter(false, "Link")).toBeFalsy();
	});
	it("affectedSystemAsLinkFormatter in edit Mode with no string", function() {
		expect(libUnderTest.affectedSystemAsLinkFormatter(false, 2)).toBeFalsy();
	});
	it("startOfDayInUTCMilliseconds", function() {
		var midnight = new Date("2015-10-25T00:00:00Z");
		var morning = new Date("2015-10-25T09:11:44Z");
		var result = libUnderTest.startOfDayInUTCMilliseconds(morning);
		expect(result).toBe(midnight.getTime());
	});
	it("floatFormatter with no digits after", function() {
		expect(libUnderTest.floatFormatter(1.0).toString()).toBe("1");
	});
	
	it("floatFormatter with one digit after", function() {
		expect(libUnderTest.floatFormatter(1.1).toString()).toBe("1.1");
	});
	
	it("floatFormatter with three digits", function() {
		expect(libUnderTest.floatFormatter(1.125).toString()).toBe("1.13");
	});

	it("patternFormatter", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("AnomalyPattern");
		
		var result = libUnderTest.patternFormatter.call(spy, "Name", "http://sap.com", "ANOMALY");
		expect(result).toBe("Name (http://sap.com) - AnomalyPattern" );
	});
	it("patternFormatter", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("AnomalyPattern");
		
		var result = libUnderTest.patternFormatter.call(spy, "Name", "http://sap.com", "FLAB");
		expect(result).toBe("Name (http://sap.com) " );
	});
	
	it("sourceEventsFormatter  no model", function() {
		var result = libUnderTest.eventSourceFormatter.call(spy, "Event");
		expect(result).toEqual("Event");
	});
	it("sourceEventsFormatter  with Log", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.sourceEventsFormatter .call(spy, "Log", "Event", "Alert", "HealthCheck");
		expect(result).toEqual("Event");
		expect(propertySpy).not.toHaveBeenCalledWith("MobAlert_TriggEvent");
	});
	it("sourceEventsFormatter  with Alert check", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.sourceEventsFormatter .call(spy, "Alert", "Event", "Alert", "HealthCheck");
		expect(result).toEqual("Alert");
		expect(propertySpy).not.toHaveBeenCalledWith("MobAlert_Alert");
	});
	it("sourceEventsFormatter  with Health check", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.sourceEventsFormatter .call(spy, "HealthCheck", "Event", "Alert", "HealthCheck");
		expect(result).toEqual("HealthCheck");
		expect(propertySpy).not.toHaveBeenCalledWith("MobAlert_HealthCheck");
	});
	it("sourceEventsFormatter  with Health check", function() {
		spy.getModel.and.returnValue(oModel);
		var propertySpy = oModel.getProperty.and.returnValue("Event");
		var result = libUnderTest.sourceEventsFormatter .call(spy, "Other", "Event", "Alert", "HealthCheck");
		expect(result).toEqual("Other");
		expect(propertySpy).not.toHaveBeenCalled();
	});
	it("scoreMeasureValueFormatter no model", function() {
		expect(libUnderTest.scoreMeasureValueFormatter.call(spy)).toBe(undefined);
	});
	it("scoreMeasureValueFormatter with Binary", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("Result");
		expect(libUnderTest.scoreMeasureValueFormatter.call(spy, "BINARY", null)).toBe("Result");
		expect(oModel.getProperty).toHaveBeenCalledWith('MobAlert_ValueNotNew');
	});
	it("scoreMeasureValueFormatter with not Binary", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue("Result");
		expect(libUnderTest.scoreMeasureValueFormatter.call(spy, "AGGREGATION", null)).toBe("Result");
		expect(oModel.getProperty).toHaveBeenCalledWith('MobAlert_ValueNoDatapoints');
	});
	it("scoreMeasureValueFormatter with Binary and a value", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.oData = {"Alerts(X'12345678901234567890123456789012')" : {BinaryScoreCount : 2}};
		oModel.getProperty.and.returnValue("Result");
		expect(libUnderTest.scoreMeasureValueFormatter.call(spy, "AGGREGATION", 2)).toBe("2");
		expect(oModel.getProperty).not.toHaveBeenCalledWith('MobAlert_ValueNoDatapoints');
	});
	it("scoreMeasureValueFormatter with Binary and a value", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.oData = {"Alerts(X'12345678901234567890123456789012')" : {BinaryScoreCount : 2}};
		oModel.getProperty.and.returnValue("Result");
		expect(libUnderTest.scoreMeasureValueFormatter.call(spy, "AGGREGATION", "1")).toBe("1");
		expect(oModel.getProperty).not.toHaveBeenCalledWith('MobAlert_ValueNoDatapoints');
	});
	
	it("InvestigationButton ", function() {
	   expect(libUnderTest.InvestigationButton(true, true)).toBe(false);
	   expect(libUnderTest.InvestigationButton(false, false)).toBe(false);
	   expect(libUnderTest.InvestigationButton(false, true)).toBe(true);
       expect(libUnderTest.InvestigationButton()).toBe(false);
	});
	
	it("_round  ", function() {
       expect(libUnderTest._round(5.45, 0 )).toBe(5);
	   expect(libUnderTest._round(5.45, 2 )).toBe(5.5);
	});
	
	it("statusSelectRestrictor", function() {
	  expect(libUnderTest.statusSelectRestrictor("EXCLUDED_EXCEPTION",null, "OPEN")).toBe(false);
	  expect(libUnderTest.statusSelectRestrictor("OPEN", null,"EXCLUDED_EXCEPTION")).toBe(false);
	  expect(libUnderTest.statusSelectRestrictor("OPEN", "123","OPEN")).toBe(false);
      expect(libUnderTest.statusSelectRestrictor("OPEN", "123","INVESTIG_TRIGGERED")).toBe(true);
      expect(libUnderTest.statusSelectRestrictor("OPEN", null,"OPEN")).toBe(true);
      expect(libUnderTest.statusSelectRestrictor("OPEN", null,"INVESTIG_TRIGGERED")).toBe(false);
      expect(libUnderTest.statusSelectRestrictor("INVESTIG_TRIGGERED", null,"INVESTIG_TRIGGERED")).toBe(true);
	});
	
    
    it("roundedValueListFormatter", function() {
      expect(libUnderTest.roundedValueListFormatter()).toBe("");
      expect(libUnderTest.roundedValueListFormatter(1)).toBe("1");
      expect(libUnderTest.roundedValueListFormatter(1,2)).toBe("1");
      expect(libUnderTest.roundedValueListFormatter(1,null,3)).toBe("1");

      oModel.getProperty.and.returnValue("Below {0}, {1}, {2}");
      expect(libUnderTest.roundedValueListFormatter.call(spy,1,2,300000000000000000,oModel)).toBe("Below 1, 2, 300000000000000000");
      
      oModel.getProperty.and.returnValue("Above {0}, {1}, {2}");
      expect(libUnderTest.roundedValueListFormatter.call(spy,30000000000000,2,1,oModel)).toBe("Above 30000000000000, 2, 1");
  
      oModel.getProperty.and.returnValue("Within {0}, {1}, {2}");
      expect(libUnderTest.roundedValueListFormatter.call(spy,2,300000000000000000,1,oModel)).toBe("Within 2, 300000000000000000, 1");
      

    });
    
    
    it("roundedValuesFormatter", function() {
        expect(libUnderTest.roundedValuesFormatter.call(spy)).toBe(undefined);
        spy.getModel.and.returnValue(oModel);

        expect(libUnderTest.roundedValuesFormatter.call(spy,null,1)).toBe("");
        expect(libUnderTest.roundedValuesFormatter.call(spy,1)).toBe("1");

        oModel.getProperty.and.returnValue("MobAlert_ValueWithRange {0}, {1}");
        expect(libUnderTest.roundedValuesFormatter.call(spy,1,2)).toBe("MobAlert_ValueWithRange 1, 2");
        
        oModel.getProperty.and.returnValue("MobAlert_ValueWithRange {0}, {1}");
        expect(libUnderTest.roundedValuesFormatter.call(spy,30000000000000,2)).toBe("MobAlert_ValueWithRange 30000000000000, 2");

      });
    
    it("absoluteOrRelativeFormatter", function() {
        oModel.getProperty.and.returnValue("MobAlert_ValueNew {0}");
        expect(libUnderTest.absoluteOrRelativeFormatter(true,true,null,null,null,oModel,2)).toBe("MobAlert_ValueNew 2");

        oModel.getProperty.and.returnValue("MobAlert_ValueNotNew");
        expect(libUnderTest.absoluteOrRelativeFormatter(true,false,null,null,null,oModel,2)).toBe("MobAlert_ValueNotNew");

      });
    

	
});