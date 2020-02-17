jQuery.sap.require("sap.secmon.ui.commons.Formatter");


describe("Commons Formatter Tests", function(){
    var libUnderTest;
    var sText = "{0} - {1}";

    beforeEach(function() {
        libUnderTest = sap.secmon.ui.commons.Formatter;
    });
    
    it("timeRangeFormatter with no times", function() {
        expect(libUnderTest.timeRangeFormatter(sText, null, undefined)).toBe("");
    });
    it("timeRangeFormatter with no times", function() {
        expect(libUnderTest.timeRangeFormatter(sText, undefined, undefined)).toBe("");
    });
    it("timeRangeFormatter with no times", function() {
        expect(libUnderTest.timeRangeFormatter(sText, undefined, null)).toBe("");
    });
    it("timeRangeFormatter with no times", function() {
        var now = new Date();
        expect(libUnderTest.timeRangeFormatter(sText, now, undefined)).toBe("");
    });
    it("timeRangeFormatter with no times", function() {
        var now = new Date();
        expect(libUnderTest.timeRangeFormatter(sText, null, now)).toBe("");
    });
    it("timeRangeFormatter with no times", function() {
        var now = new Date();
        expect(libUnderTest.timeRangeFormatter(sText, undefined, now)).toBe("");
    });
    it("timeRangeFormatter with two times", function() {
        var now = new Date();
        expect(libUnderTest.timeRangeFormatter(sText, now, now)).not.toBe("");
    });
    

    it("weekdayFormatter with and without UTC", function() {
        var globalSaturday = new Date("2015-05-02T23:00:00Z");
        expect(libUnderTest.weekdayFormatter(true, globalSaturday)).toBe("Saturday");
        expect(libUnderTest.weekdayFormatter(false, new Date(globalSaturday))).toBe("Sunday");
    });
    
    it("timeOnlyFormatter with and without UTC should not display timezone information", function() {
        // switch from daylight saving time back to normal time
        var globalSundayMorning0 = new Date("2015-10-25T00:00:00Z");
        expect(libUnderTest.timeOnlyFormatter(true, globalSundayMorning0)).toBe("12:00 AM");
        expect(libUnderTest.timeOnlyFormatter(false, globalSundayMorning0)).toBe("02:00A AM");
        
        var globalSundayMorning1 = new Date("2015-10-25T01:00:00Z");
        expect(libUnderTest.timeOnlyFormatter(true, globalSundayMorning1)).toBe("01:00 AM");
        expect(libUnderTest.timeOnlyFormatter(false, globalSundayMorning1)).toBe("02:00B AM");

        var globalSundayMorning2 = new Date("2015-10-25T02:00:00Z");
        expect(libUnderTest.timeOnlyFormatter(true, globalSundayMorning2)).toBe("02:00 AM");
        expect(libUnderTest.timeOnlyFormatter(false, globalSundayMorning2)).toBe("03:00 AM");
    });
    
    it("timeFormatter with and without UTC should display timezone info", function() {
        // switch from daylight saving time back to normal time
        var globalSundayMorning0 = new Date("2015-10-25T00:00:00Z");
        expect(libUnderTest.timeFormatter(true, globalSundayMorning0)).toBe("12:00:00 AM UTC");
        expect(libUnderTest.timeFormatter(false, globalSundayMorning0)).toBe("2:00:00 AM GMT+02:00");
        
        var globalSundayMorning1 = new Date("2015-10-25T01:00:00Z");
        expect(libUnderTest.timeFormatter(true, globalSundayMorning1)).toBe("1:00:00 AM UTC");
        expect(libUnderTest.timeFormatter(false, globalSundayMorning1)).toBe("2:00:00 AM GMT+01:00");

        var globalSundayMorning2 = new Date("2015-10-25T02:00:00Z");
        expect(libUnderTest.timeFormatter(true, globalSundayMorning2)).toBe("2:00:00 AM UTC");
        expect(libUnderTest.timeFormatter(false, globalSundayMorning2)).toBe("3:00:00 AM GMT+01:00");
        
    });
    
    
    it("timezoneInfo with and without UTC should display correct timezone", function() {
        // switch from daylight saving time back to normal time
        var globalSundayMorning0 = new Date("2015-10-25T00:00:00Z");
        expect(libUnderTest.timezoneInfo(true, globalSundayMorning0)).toBe("UTC");
        expect(libUnderTest.timezoneInfo(false, globalSundayMorning0)).toBe("GMT+02:00");
        
        var globalSundayMorning1 = new Date("2015-10-25T01:00:00Z");
        expect(libUnderTest.timezoneInfo(true, globalSundayMorning1)).toBe("UTC");
        expect(libUnderTest.timezoneInfo(false, globalSundayMorning1)).toBe("GMT+01:00");

        var globalSundayMorning2 = new Date("2015-10-25T02:00:00Z");
        expect(libUnderTest.timezoneInfo(true, globalSundayMorning2)).toBe("UTC");
        expect(libUnderTest.timezoneInfo(false, globalSundayMorning2)).toBe("GMT+01:00");
        
    });
    
    it("encodeHTML with empty string", function() {
       var input = null;
       expect(libUnderTest.encodeHTML(input)).toBe("<p/>");
       input = undefined;
       expect(libUnderTest.encodeHTML(input)).toBe("<p/>");
       input = "";
       expect(libUnderTest.encodeHTML(input)).toBe("<p/>");
    });
    it("encodeHTML with string containing hard-coded width", function() {
        var string = '<p style=" anAttribute:1234yyyyy; width:123px;max-width:auto;" another style=" anAttribute:1234yyyyy; width:444px;max-width:auto;" />';
        var tested = libUnderTest.encodeHTML(string);
        
        var expected = '<div class="wrappedText" style="max-width:790px"><p style=" anAttribute:1234yyyyy;width:auto;max-width:auto;" another style=" anAttribute:1234yyyyy;width:auto;max-width:auto;" /></div>';
        
        expect(tested).toBe(expected);
    });

    
    it("booleanANDed combines several boolean arguments", function() {
        expect(libUnderTest.booleanANDed(true, true, true)).toBe(true);
        expect(libUnderTest.booleanANDed(false, true, true)).toBe(false);
        expect(libUnderTest.booleanANDed(false, false, false)).toBe(false);
        expect(libUnderTest.booleanANDed(true, true, null)).toBe(false);
        expect(libUnderTest.booleanANDed(true, true, "a string")).toBe(false);
     });
    
    it("booleanORed combines several boolean arguments", function() {
        expect(libUnderTest.booleanORed(true, true, true)).toBe(true);
        expect(libUnderTest.booleanORed(false, false, false)).toBe(false);
        expect(libUnderTest.booleanORed(false, true, true)).toBe(true);
        expect(libUnderTest.booleanORed(true, true, null)).toBe(true);
        expect(libUnderTest.booleanORed(true, true, "a string")).toBe(true);
     });
    
});