jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

describe("CommonFunctions", function() {
    var commonFunctions;

    var fail = function() {
        expect(false).toBeTruthy();
    };
    
    beforeEach(function() {
        commonFunctions = new sap.secmon.ui.commons.CommonFunctions();
    });
    it("test formatDateToYyyymmdd with day and month one digit", function() {
    	var date = new Date(Date.parse("2016-06-01T13:00:00Z"));
    	
    	var result = commonFunctions.formatDateToYyyymmdd(date);
    	
    	expect(result).toBe("20160601");
    });
    it("test formatDateToYyyymmdd with day and month two digits", function() {
    	var date = new Date(Date.parse("2016-10-12T13:00:00Z"));
    	
    	var result = commonFunctions.formatDateToYyyymmdd(date);
    	
    	expect(result).toBe("20161012");
    });
    it("test parseYyyymmdd with correct date", function() {
    	var result = commonFunctions.parseYyyymmdd("20161012");
    	
    	expect(result.toISOString().substring(0,10)).toBe("2016-10-11");
    });
    
    it("test parseYyyyymmdd with incorrect date", function() {
    	var result = commonFunctions.parseYyyymmdd("Wrong date");
    	
    	expect(result).toBe(null);
    });
    it("test formatTwoDigits with two digit number", function() {
    	var resultString = "12";
    	var result = commonFunctions.formatTwoDigits("12");
    	expect(result.toString()).toBe(resultString);
    });
    
    it("test formatTwoDigits with one digit number", function() {
    	var resultString = "1";
    	var result = commonFunctions.formatTwoDigits("1");
    	expect(result.toString()).not.toBe(resultString);
       	expect(result).toBe("01");
    });
    it("formatDatTimeInputToDate", function() {
    	var oDatePicker = jasmine.createSpyObj("oDatePicker", ["getYyyymmdd"]);
    	var oTimeInput = jasmine.createSpyObj("oTimeInput", ["getValue"]);
    	
    	oDatePicker.getYyyymmdd.and.returnValue("20161012");
    	oTimeInput.getValue.and.returnValue("12:00");
    	
    	var date = commonFunctions.formatDateTimeInputToDate(oDatePicker, oTimeInput);
    	
    	expect(date.getFullYear()).toBe(2016);
    	expect(date.getMonth()).toBe(9);
    	expect(date.getDate()).toBe(12);
    });
    it("test formatDateToYyyymmddUTC with day and month one digit", function() {
    	var date = new Date(Date.parse("2016-06-01T13:00:00Z"));
    	
    	var result = commonFunctions.formatDateToYyyymmddUTC(date);
    	
    	expect(result).toBe("20160601");
    });
    it("test formatDateToYyyymmddUTC with day and month two digits", function() {
    	var date = new Date(Date.parse("2016-10-12T13:00:00Z"));
    	
    	var result = commonFunctions.formatDateToYyyymmddUTC(date);
    	
    	expect(result).toBe("20161012");
    });
  it("test validate time with valid Date", function() {
       var control = jasmine.createSpyObj('control', ["getValue", "setValueState"]);
       control.getValue.and.returnValue("12:15:32");
       
       var result = commonFunctions.validateTime(control);
       
       expect(control.setValueState).toHaveBeenCalled();
       expect(control.setValueState.calls.argsFor(0)[0]).toEqual(sap.ui.core.ValueState.None);
       expect(result).toBe(true);
    });
    it("test validate time with invalid Date", function() {
        var control = jasmine.createSpyObj('control', ["getValue", "setValueState"]);
        control.getValue.and.returnValue("12;15:32");
        
        var result = commonFunctions.validateTime(control);
        
        expect(control.setValueState).toHaveBeenCalled();

        expect(control.setValueState.calls.argsFor(0)[0]).toEqual(sap.ui.core.ValueState.Error);
        expect(result).toBe(false);
     });
    it("test parse time", function() {
        var result = commonFunctions.parseTime("12:15:32");
        
        expect(result instanceof Date).toBe(true);
        expect(result.getHours()).toBe(12);
        expect(result.getMinutes()).toBe(15);
        expect(result.getSeconds()).toBe(32);
     });
    
    it("dateFormatter with null", function() {
        expect(commonFunctions.dateFormatter(null)).toEqual("");
    });
    it("dateFormatter with undefined", function() {
        expect(commonFunctions.dateFormatter(undefined)).toEqual("");
    });
    it("dateFormatter with \"\"", function() {
        expect(commonFunctions.dateFormatter("")).toEqual("");
    });
    
    it("dateFormatter with valid Time", function() {
        var d = new Date(1477564928678);
        
        var result = commonFunctions.dateFormatter(d);
        expect(typeof result).toEqual("string");
        expect(result).toContain("16");
        expect(result).toContain("10");
        expect(result).toContain("27");
    });
    
    it("should be able to decode base 64 string", function() {
        var result = commonFunctions.base64ToHex("aGFsbG8=");
        expect(result).toEqual("68616C6C6F"); // hallo

        result = commonFunctions.base64ToHex("d2VsdA==");
        expect(result).toEqual("77656C74"); // welt

        result = commonFunctions.base64ToHex("w6TDtsO8w4TDlsOcw58=");
        expect(result).toEqual("C3A4C3B6C3BCC384C396C39CC39F"); // äöüÄÖÜß
    });

    it("should be able to encode to base64 string", function() {
        var result = commonFunctions.hexToBase64("68616C6C6F"); // hallo
        expect(result).toEqual("aGFsbG8=");

        result = commonFunctions.hexToBase64("77656C74"); // welt
        expect(result).toEqual("d2VsdA==");

        result = commonFunctions.hexToBase64("C3A4C3B6C3BCC384C396C39CC39F"); // äöüÄÖÜß
        expect(result).toEqual("w6TDtsO8w4TDlsOcw58=");
    });

    it("should be able to check if it is a hex value", function() {
        var result = commonFunctions.isHex(undefined);
        expect(result).toBe(false);

        result = commonFunctions.isHex(null);
        expect(result).toBe(false);

        result = commonFunctions.isHex("68616C6C6F"); // hallo
        expect(result).toBe(true);

        result = commonFunctions.isHex("77656C74"); // welt
        expect(result).toBe(true);

        result = commonFunctions.isHex("ZZZ"); // invalid value
        expect(result).toBe(false);
    });

    it("should be able to convert a hex value", function() {
        var result = commonFunctions.toHex(null);
        expect(result).toEqual("");

        result = commonFunctions.toHex(undefined);
        expect(result).toEqual("");

        result = commonFunctions.toHex("hallo"); // hallo
        expect(result).toEqual("68616C6C6F");

        result = commonFunctions.toHex("welt"); // invalid value
        expect(result).toEqual("77656C74");
    });

    it("should compare two objects", function() {
        var cmp = commonFunctions.deepEqual;
        expect(cmp({}, {})).toBe(true);
        expect(cmp({
            a : 1
        }, {
            a : 1
        })).toBe(true);
        expect(cmp({
            a : 1
        }, {
            a : "1"
        })).toBe(false);
        expect(cmp({
            a : 1,
            b : 1
        }, {
            b : 1,
            a : 1
        })).toBe(true);
        expect(cmp({
            a : 1,
            b : 1
        }, {
            b : 1,
            a : 1,
            c : 1
        })).toBe(false);
        expect(cmp({
            a : 1,
            b : {
                c : 1
            }
        }, {
            a : 1,
            b : {
                c : 1
            }
        })).toBe(true);
        expect(cmp({
            a : 1,
            b : {
                c : 1
            }
        }, {
            a : 1,
            b : {
                c : 2
            }
        })).toBe(false);
        var d1 = new Date(4711);
        var d2 = new Date(4711);
        var d3 = new Date(4712);
        expect(cmp({
            a : d1
        }, {
            a : d2
        })).toBe(true);
        expect(cmp({
            a : d1
        }, {
            a : d3
        })).toBe(false);
        var o = {
            a : 1
        };
        expect(cmp(o, o)).toBe(true);
    });

    it("should clone an object", function() {
        var clone = commonFunctions.cloneObject;
        var o1 = {
            a : 1,
            b : 2
        };
        var o2 = clone(o1);
        expect(o1).not.toBe(o2);
        expect(commonFunctions.deepEqual(o1, o2)).toBe(true);
        o1 = {
            a : 1,
            b : {
                c : 1
            }
        };
        o2 = clone(o1);
        expect(commonFunctions.deepEqual(o1, o2)).toBe(true);
        // ensure clone also copies nested objects
        o1 = {
            c : 1
        };
        o2 = {
            a : 1,
            b : o1
        };
        var o3 = clone(o2);
        expect(commonFunctions.deepEqual(o2, o3)).toBe(true);
        expect(o3.b).not.toBe(o1);
    });

    it("should return distinct values of a column", function() {
        var dv = commonFunctions.distinctValuesOfColumn;
        var aObjects = [ {
            a : null
        }, {
            a : "1"
        }, {
            a : "2"
        }, {
            a : "2"
        } ];
        var aResult = dv(aObjects, "a");
        expect(aResult.length).toBe(2);
        var oResult1 = aResult[0];
        var oResult2 = aResult[1];
        // check if "1" and "2" are contained. Order is not guaranteed.
        if (oResult1.a === "1") {
            expect(oResult2.a).toBe("2");
        } else if (oResult1.a === "2") {
            expect(oResult2.a).toBe("1");
        } else {
            fail();
        }
    });

});
