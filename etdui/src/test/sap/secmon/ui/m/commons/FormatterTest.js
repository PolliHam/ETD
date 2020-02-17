jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");


describe("commons Formatter Tests", function(){
    var libUnderTest, spy;

    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.commons.Formatter;
        spy = jasmine.createSpyObj("controller", ["getModel"]);
    });
    
    it("Guid Formatter", function() {
        var oCommons = new sap.secmon.ui.commons.CommonFunctions();
        expect(libUnderTest.guidFormatter("L/7u3dt10Ea4Vk8W5msgPA==" )).toEqual(oCommons.base64ToHex("L/7u3dt10Ea4Vk8W5msgPA=="));
    });
   
    it("patternTypeYesNoFormatter Formatter", function() {
        expect(libUnderTest.patternTypeYesNoFormatter("ANOMALY","YES","NO")).toEqual("YES");
        expect(libUnderTest.patternTypeYesNoFormatter("HUGO","YES","NO")).toEqual("NO");
    });
    
    it("patternTypeFormatter Formatter", function() {
        expect(libUnderTest.patternTypeFormatter("ANOMALY", "AnomalyPattern")).toEqual("AnomalyPattern");
        expect(libUnderTest.patternTypeFormatter("HUGO", "AnomalyPattern")).toEqual("");
    });
    
    it("countArrayFormatter with a single text", function() {
        var i18nSpy = spyOn(sap.secmon.ui.commons.Formatter, "i18nText").and.returnValue("Text");
        libUnderTest.countArrayFormatter("Text");
        
        expect(i18nSpy).toHaveBeenCalledWith("Text", 0);
    });
    it("countArrayFormatter with text and null", function() {
        var i18nSpy = spyOn(sap.secmon.ui.commons.Formatter, "i18nText").and.returnValue("Text");
        libUnderTest.countArrayFormatter("Text", null);
        
        expect(i18nSpy).toHaveBeenCalledWith("Text", 0);
    });
    it("countArrayFormatter with text and empty array", function() {
        var i18nSpy = spyOn(sap.secmon.ui.commons.Formatter, "i18nText").and.returnValue("Text");
        libUnderTest.countArrayFormatter("Text", []);
        
        expect(i18nSpy).toHaveBeenCalledWith("Text", 0);
    });
    it("countArrayFormatter with text and non empty array", function() {
        var i18nSpy = spyOn(sap.secmon.ui.commons.Formatter, "i18nText").and.returnValue("Text");
        libUnderTest.countArrayFormatter("Text", [1]);
        
        expect(i18nSpy).toHaveBeenCalledWith("Text", 1);
    });
    
    it("countFormatter  no model", function() {
        expect(libUnderTest.countFormatter("TEXT {0}")).toBe("TEXT 0");
        expect(libUnderTest.countFormatter("TEXT {0}", null)).toBe("TEXT 0");
        expect(libUnderTest.countFormatter("TEXT {0}", 1)).toBe("TEXT 1");
     });
    
    it("Enum Formatter", function() {
        expect(libUnderTest.enumFormatter({keyValueMap: {
                                            HIGH:"High",
                                            LOW:"Low",
                                            MEDIUM:"Medium",
                                            VERY_HIGH:"Very High" 
                                          }
                        }, "MEDIUM")).toEqual("Medium");
        expect(libUnderTest.enumFormatter(null, "MEDIUM")).toEqual("MEDIUM");
        expect(libUnderTest.enumFormatter(undefined, "MEDIUM")).toEqual("MEDIUM");
        expect(libUnderTest.enumFormatter({keyValueMap: {
            HIGH:"High",
            LOW:"Low",
            VERY_HIGH:"Very High" 
          }
            }, "MEDIUM")).toEqual("MEDIUM");
        expect(libUnderTest.enumFormatter({keyValueMap: {
            HIGH:"High",
            LOW:"Low",
            MEDIUM: null,
            VERY_HIGH:"Very High" 
          }
            }, "MEDIUM")).toEqual("MEDIUM");
    });
    
});