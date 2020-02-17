jQuery.sap.require("sap.secmon.ui.loglearning.util.Formatter");
jQuery.sap.require("sap.ui.core.ValueState");


describe("Log Learning Formatter Tests", function(){
    var libUnderTest;

    beforeEach(function() {
        libUnderTest = sap.secmon.ui.loglearning.util.Formatter;
    });
    
    it("displayname Formatter with and without namespace", function() {
        var displayName = "displayName";
        var namespace = "namespace";
        expect(libUnderTest.displayNameFormatter(displayName, namespace)).toContain(displayName);
        expect(libUnderTest.displayNameFormatter(displayName, namespace)).toContain(namespace);
        expect(libUnderTest.displayNameFormatter(displayName, null)).toEqual(displayName);
    });

    it("nameDescription Formatter", function() {
        var name = "name";
        var description = "description";
        expect(libUnderTest.nameDescriptionFormatter(name, description)).toContain(name);
        expect(libUnderTest.nameDescriptionFormatter(name, description)).toContain(description);
        expect(libUnderTest.nameDescriptionFormatter(name, null)).toEqual(name);
        expect(libUnderTest.nameDescriptionFormatter(null, description)).toEqual(description);
    });
    
    
    it("hashValueState Formatter", function() {
        var eventGuidHex = "0011";
        var nullEventGuidHex = "30";
        var logTypeGuidHex = "0022";
        var nullLogTypeGuidHex = "30";
        
        expect(libUnderTest.hashValueStateFormatter(eventGuidHex, logTypeGuidHex)).toEqual(sap.ui.core.ValueState.None);
        expect(libUnderTest.hashValueStateFormatter(nullEventGuidHex, nullLogTypeGuidHex)).toEqual(sap.ui.core.ValueState.None);
        
        expect(libUnderTest.hashValueStateFormatter(nullEventGuidHex, logTypeGuidHex)).toEqual(sap.ui.core.ValueState.Error);
        expect(libUnderTest.hashValueStateFormatter(eventGuidHex, nullLogTypeGuidHex)).toEqual(sap.ui.core.ValueState.Error);
        expect(libUnderTest.hashValueStateFormatter(null, logTypeGuidHex)).toEqual(sap.ui.core.ValueState.Error);
        expect(libUnderTest.hashValueStateFormatter(eventGuidHex, null)).toEqual(sap.ui.core.ValueState.Error);
    });
    
    it("valueState Formatter", function() {

        expect(libUnderTest.valueStateFormatter("aaa", "BBB")).toEqual(sap.ui.core.ValueState.None);
        expect(libUnderTest.valueStateFormatter(null, null)).toEqual(sap.ui.core.ValueState.None);
        expect(libUnderTest.valueStateFormatter("", "")).toEqual(sap.ui.core.ValueState.None);
        
        expect(libUnderTest.valueStateFormatter(null, "BB")).toEqual(sap.ui.core.ValueState.Error);
        expect(libUnderTest.valueStateFormatter("aaa", null)).toEqual(sap.ui.core.ValueState.Error);
        expect(libUnderTest.valueStateFormatter("", "BB")).toEqual(sap.ui.core.ValueState.Error);
        expect(libUnderTest.valueStateFormatter("aaa", "")).toEqual(sap.ui.core.ValueState.Error);
    });
    
    
    it("parse Log Layout: isKVLogLayout", function(){
        expect(libUnderTest.isKVLogLayout("KV;:;-")).toBeTruthy();
        expect(libUnderTest.isKVLogLayout("ST;:")).toBeFalsy();
        expect(libUnderTest.isKVLogLayout("TX")).toBeFalsy();
        expect(libUnderTest.isKVLogLayout(null)).toBeFalsy();
    });
    
    it("parse Log Layout: isSTLogLayout", function(){
        expect(libUnderTest.isSTLogLayout("KV;:;-")).toBeFalsy();
        expect(libUnderTest.isSTLogLayout("ST;:")).toBeTruthy();
        expect(libUnderTest.isSTLogLayout("TX")).toBeFalsy();
        expect(libUnderTest.isSTLogLayout(null)).toBeFalsy();
    });
    
    it("parse Log Layout: kvSeparator", function(){
        expect(libUnderTest.kvSeparator("KV;:;-")).toBe(':');
        expect(libUnderTest.kvSeparator("ST;:")).toBeNull();
        expect(libUnderTest.kvSeparator("TX")).toBeNull();
        expect(libUnderTest.kvSeparator(null)).toBeNull();
    });
    
    it("parse Log Layout: kvpSeparator", function(){
        expect(libUnderTest.kvpSeparator("KV;:;-")).toBe('-');
        expect(libUnderTest.kvpSeparator("ST;:;-")).toBeNull();
        expect(libUnderTest.kvpSeparator("TX")).toBeNull();
        expect(libUnderTest.kvpSeparator(null)).toBeNull();
    });
    
    it("parse Log Layout: listSeparator", function(){
        expect(libUnderTest.listSeparator("KV;:;-")).toBeNull();
        expect(libUnderTest.listSeparator("ST;:")).toBe(':');
        expect(libUnderTest.listSeparator("TX;")).toBeNull();
        expect(libUnderTest.listSeparator(null)).toBeNull();
    });
    
    
    it("convert advanced regex with named groups and negative lookbehind condition into a regex understood in Javascript", function(){
        // regex with named group and negative lookbehind
        var sAdvancedRegex = '(?:\<(?<Integer1>-?\d+)\>)?(?:(?<Var1>\d+\/\d+\/\d+\s+\d+:\d+:\d+\s{1,2}[AP]M\s{1,2}\w+)\s+)?' +
        '(?<Timestamp1>\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}:\d{2}(?:\.(?:\d{3}){1,2})?(?:Z|[\+\-]\d{2}:?(?:\d{2})))\s+(?<Var2>[^:]+?\s+)?' +
        '(?<Var3>.+?)(?<!:):\s+(?<Var4>.+?)(?<=lookbehind):\s+(?<Var5>.+?)\s+(?<Var6>.+?)\s+(?<Var7>.+?)\s+' +
        '(?<Timestamp2>\w+\s{1,2}\d+,?\s{1,2}\d+\s{1,2}\d+:\d+:\d+\s{1,2}(Z|[\+\-]\d{2}:?(\d{2})?))\s+\[(?<Var8>.+?):(?<Var9>.+?):' +
        '(?<Var10>.+?)\]\s+(?<StructuredList1>.*::.*)(?>regex1)(?>regex2)';
        var sExpectedDowngradedRegex = '(?:\<(-?\d+)\>)?(?:(\d+\/\d+\/\d+\s+\d+:\d+:\d+\s{1,2}[AP]M\s{1,2}\w+)\s+)?' +
        '(\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}:\d{2}(?:\.(?:\d{3}){1,2})?(?:Z|[\+\-]\d{2}:?(?:\d{2})))\s+([^:]+?\s+)?(.+?):\s+' +
        '(.+?):\s+(.+?)\s+(.+?)\s+(.+?)\s+(\w+\s{1,2}\d+,?\s{1,2}\d+\s{1,2}\d+:\d+:\d+\s{1,2}(Z|[\+\-]\d{2}:?(\d{2})?))\s+\[' +
        '(.+?):(.+?):(.+?)\]\s+(.*::.*)(regex1)(regex2)';
        // User will input regex for Java (with named groups and negative lookbehind).
        // But validation happens in browser with JS regex.
        var sDowngradedRegex = libUnderTest.downgradeRegex(sAdvancedRegex);
        var oRegex = new RegExp(sDowngradedRegex);
        oRegex.exec("");

        expect(sDowngradedRegex).toBe(sExpectedDowngradedRegex);
        
    });
});