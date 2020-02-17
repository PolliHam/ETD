jQuery.sap.require("sap.secmon.ui.m.executionResultsfs.util.Formatter");


describe("executionResultsfs Formatter Tests", function(){
    var libUnderTest;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.executionResultsfs.util.Formatter;
    });


    it("alertNumberFormatter Formatter", function() {
        expect(libUnderTest.alertNumberFormatter(1,5)).toEqual("1/5");
    });
    it("runtimeformatter", function() {
        expect(libUnderTest.runtimeformatter(1000)).toBe(1);
    });
    it("timeformatter", function() {
        expect(libUnderTest.timeformatter(263520000)).toBe('2018-05-09');
    });
    it("convertToUnixTime", function() {
        expect(libUnderTest.convertToUnixTime(263520000)).toBe(Date.parse('2018-05-09T00:00:00.00Z'));
    });
    it("averageFormatter", function() {
        expect(libUnderTest.averageFormatter(100,1)).toBe(100);
    });
    it("averageFormatter", function() {
        expect(libUnderTest.averageFormatter(100,100)).toBe(1);
    });
    
   
    
});