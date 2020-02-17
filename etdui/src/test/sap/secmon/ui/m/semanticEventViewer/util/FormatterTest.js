


describe("semanticEventViewer Formatter Tests", function(){
	jQuery.sap.require("sap.secmon.ui.m.semanticEventViewer.util.Formatter");
	jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
	
	var libUnderTest;
	var spy;
	var oModel;
	var oBindingContext;
	beforeEach(function() {
		libUnderTest = sap.secmon.ui.m.semanticEventViewer.util.Formatter;
	});

	afterEach(function() {
	});
	beforeEach(function() {
		spy = jasmine.createSpyObj("controller", ["getModel", "getBindingContext"]);
		oModel = jasmine.createSpyObj("oModel",["method", "getProperty"]);
		oTextModel = jasmine.createSpyObj("oTextModel", ["getProperty"]);
		oBindingContext = jasmine.createSpyObj("oBindingContext", ["getProperty", "getModel", "getPath"]);
		var enumServiceSpy = spyOn(sap.secmon.ui.m.alerts.util.Formatter.oEnumService, "getEnumValue");
		
		spyOn(sap.secmon.ui.commons.Formatter, "dateFormatterEx").and.returnValue("Datum");
	});
	var spy, oModel, enumServiceSpy;
	it("userFormatter with initiating user without system", function() {
		expect(libUnderTest.userFormatter(null)).toBe("");
	});
	it("userFormatter with no system", function() {
		expect(libUnderTest.userFormatter("User", null)).toBe("User ");
	});
	it("userFormatter with a domainname", function() {
		expect(libUnderTest.userFormatter("User", null, "JAVA", "domain")).toBe("User domain");
	});
	it("userFormatter with a sytem", function() {
		expect(libUnderTest.userFormatter("User", "system", "JAVA")).toBe("User system(JAVA)")
	});
	it("userFormatter with initiating user without system", function() {
		expect(libUnderTest.userFormatter(null, "system")).toBe("");
	});
	it("parameterFormatter without input ", function() {
		expect(libUnderTest.parameterFormatter()).toBe("");
	});
	it("parameterFormatter with timestamp ", function() {
		expect(libUnderTest.parameterFormatter.call(spy, false, undefined, undefined, undefined, new Date(), "Type")).toBe("Datum (Type)");
	});
	it("parameterFormatter with double ", function() {
		expect(libUnderTest.parameterFormatter.call(spy, false, 2., undefined, undefined, undefined, "Type")).toBe("2 (Type)");
	});
	it("parameterFormatter with number ", function() {
		expect(libUnderTest.parameterFormatter.call(spy,false, undefined, 2, undefined, undefined, "Type")).toBe("2 (Type)");
	});
	it("parameterFormatter with string ", function() {
		expect(libUnderTest.parameterFormatter.call(spy, false, undefined, undefined, "2", undefined, "Type")).toBe("2 (Type)");
	});
	it("visibleFormatter with no arguments", function() {
		expect(libUnderTest.visibleFormatter()).toBeFalsy();
	});
	
	it("visibleFormatter with empty arguments", function() {
		expect(libUnderTest.visibleFormatter(undefined)).toBeFalsy();
	});
	it("visibleFormatter with some", function() {
		expect(libUnderTest.visibleFormatter(undefined, "s")).toBeTruthy();
	});
	it("systemFormatter with information", function() {
		expect(libUnderTest.systemFormatter("ABC", "ABAP")).toBe("ABC(ABAP)");
	});
	it("systemFormatter", function() {
		expect(libUnderTest.systemFormatter("ABC")).toBe("ABC");
	});
	it("systemFormatter", function() {
		expect(libUnderTest.systemFormatter()).toBe("");
	});
	it("systemFormatter", function() {
		expect(libUnderTest.systemFormatter(undefined, "ABAP")).toBe("(ABAP)");
	});
	it("anomalyLinkFormatter", function() {
		expect(libUnderTest.anomalyLinkFormatter("123", "INDICATOR_ANOMALY")).toBeTruthy();
	});
	
	it("anomalyLinkFormatter", function() {
		expect(libUnderTest.anomalyLinkFormatter(null, "INDICATOR_ANOMALY")).toBeFalsy();
	});
	it("anomalyLinkFormatter", function() {
		expect(libUnderTest.anomalyLinkFormatter("123", "ANOMALY")).toBeFalsy();
	});
	it("anomalyTextFormatter", function() {
		expect(libUnderTest.anomalyTextFormatter("123", "INDICATOR_ANOMALY")).toBeFalsy();
	});
	
	it("anomalyTextFormatter", function() {
		expect(libUnderTest.anomalyTextFormatter(null, "INDICATOR_ANOMALY")).toBeTruthy();
	});
	it("anomalyTextFormatter", function() {
		expect(libUnderTest.anomalyTextFormatter("123", "ANOMALY")).toBeTruthy();
	});
	it("sentenceTextFormatter without sentences", function() {
		expect(libUnderTest.sentenceTextFormatter()).toBe("");
	});
	it("sentenceTextFormatter with sentences without model data", function() {
		expect(libUnderTest.sentenceTextFormatter(["sentence"])).toBe("");
	});
	it("sentenceTextFormatter with single sentence", function() {
	    oTextModel.getProperty.and.returnValue("SentenceWord")
		spy.getModel.and.callFake(function(modelName) {
		    switch(modelName) {
		    case "i18nknowledge":
		        return oTextModel;
		    default:
		        return oModel;
		    }
		});
		oModel.getProperty.and.returnValue({number : 1, sentence : "Sentence", DisplayKey : "SentenceKey"});
		spy.getBindingContext.and.returnValue(oBindingContext);
		oBindingContext.getProperty.and.returnValue([]);
		oBindingContext.getModel.and.returnValue(oModel);
		oBindingContext.getPath.and.returnValue("path");
		expect(libUnderTest.sentenceTextFormatter.call(spy, ["sentence"], "Pseudonym")).toBe("SentenceWord");
		expect(oTextModel.getProperty).toHaveBeenCalledWith("SentenceKey");
	});
	it("sentenceTextFormatter with one parameter", function() {
        oTextModel.getProperty.and.returnValue("SentenceWord ${SystemId}")
        spy.getModel.and.callFake(function(modelName) {
            switch(modelName) {
            case "i18nknowledge":
                return oTextModel;
            default:
                return oModel;
            }
        });
        oModel.getProperty.and.callFake(function(path){
            if(path === "path") {
                return {SystemId : 'YI3'};
            }
            return {number : 1, sentence : "Sentence ${SystemId}", DisplayKey : "SentenceKey"};
            });
        
        spy.getBindingContext.and.returnValue(oBindingContext);
        oBindingContext.getProperty.and.returnValue([]);
        oBindingContext.getModel.and.returnValue(oModel);
        oBindingContext.getPath.and.returnValue("path");
        expect(libUnderTest.sentenceTextFormatter.call(spy, ["sentence"], "Pseudonym")).toBe("SentenceWord YI3");
        expect(oTextModel.getProperty).toHaveBeenCalledWith("SentenceKey");	    
	});
    it("sentenceTextFormatter with one parameter and two alternatives matching second", function() {
        oTextModel.getProperty.and.callFake(function(prop) {
            switch(prop) {
            case "SentenceKey1":
                return "SentenceWord ${SystemId} ${SystemType}" ;
            

        case "SentenceKey2":
           return "Sentence ${SystemId}"; }
        });
        spy.getModel.and.callFake(function(modelName) {
            switch(modelName) {
            case "i18nknowledge":
                return oTextModel;
            default:
                return oModel;
            }
        });
        oModel.getProperty.and.callFake(function(path){
            switch(path) {
            case "path":
                return {SystemId : 'YI3'};
            case "/sentence1":
                return {number : 1, sentence : "Sentence ${SystemId} ${SystemType}", DisplayKey : "SentenceKey1"};
            case "/sentence2":
                return {number : 1, sentence : "Sentence ${SystemId}", DisplayKey : "SentenceKey2"};
            }
            
            
            });
        
        spy.getBindingContext.and.returnValue(oBindingContext);
        oBindingContext.getProperty.and.returnValue([]);
        oBindingContext.getModel.and.returnValue(oModel);
        oBindingContext.getPath.and.returnValue("path");
        expect(libUnderTest.sentenceTextFormatter.call(spy, ["sentence1", "sentence2"], "Pseudonym")).toBe("Sentence YI3");
        expect(oTextModel.getProperty).toHaveBeenCalledWith("SentenceKey2");     
    });
    it("sentenceTextFormatter with one parameter and two alternatives matching first", function() {
        oTextModel.getProperty.and.callFake(function(prop) {
            switch(prop) {
            case "SentenceKey1":
                return "SentenceWord ${SystemId}" ;
            

        case "SentenceKey2":
           return "Sentence"; }
        });
        spy.getModel.and.callFake(function(modelName) {
            switch(modelName) {
            case "i18nknowledge":
                return oTextModel;
            default:
                return oModel;
            }
        });
        oModel.getProperty.and.callFake(function(path){
            switch(path) {
            case "path":
                return {SystemId : 'YI3'};
            case "/sentence1":
                return {number : 1, sentence : "Sentence ${SystemId}", DisplayKey : "SentenceKey1"};
            case "/sentence2":
                return {number : 1, sentence : "Sentence", DisplayKey : "SentenceKey2"};
            }
            
            
            });
        
        spy.getBindingContext.and.returnValue(oBindingContext);
        oBindingContext.getProperty.and.returnValue([]);
        oBindingContext.getModel.and.returnValue(oModel);
        oBindingContext.getPath.and.returnValue("path");
        expect(libUnderTest.sentenceTextFormatter.call(spy, ["sentence1", "sentence2"], "Pseudonym")).toBe("SentenceWord YI3");
        expect(oTextModel.getProperty).toHaveBeenCalledWith("SentenceKey1");     
    });

    it("sentenceTextFormatter with two sentences", function() {
        oTextModel.getProperty.and.callFake(function(prop) {
            switch(prop) {
            case "SentenceKey1":
                return "SentenceWord ${SystemId}" ;
            

        case "SentenceKey2":
           return "Sentence ${SystemId}"; }
        });
        spy.getModel.and.callFake(function(modelName) {
            switch(modelName) {
            case "i18nknowledge":
                return oTextModel;
            default:
                return oModel;
            }
        });
        oModel.getProperty.and.callFake(function(path){
            switch(path) {
            case "path":
                return {SystemId : 'YI3'};
            case "/sentence1":
                return {number : 1, sentence : "SentenceWord ${SystemId}", DisplayKey : "SentenceKey1"};
            case "/sentence2":
                return {number : 2, sentence : "Sentence ${SystemId}", DisplayKey : "SentenceKey2"};
            }
            
            
            });
        
        spy.getBindingContext.and.returnValue(oBindingContext);
        oBindingContext.getProperty.and.returnValue([]);
        oBindingContext.getModel.and.returnValue(oModel);
        oBindingContext.getPath.and.returnValue("path");
        expect(libUnderTest.sentenceTextFormatter.call(spy, ["sentence1", "sentence2"], "Pseudonym")).toBe("SentenceWord YI3 Sentence YI3");
        expect(oTextModel.getProperty).toHaveBeenCalledWith("SentenceKey2");     
    });
	it("linkFormatter without text", function() {
		expect(libUnderTest.linkFormatter()).toEqual([]);
	});

	it("linkFormatter with one sentence", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getProperty.and.returnValue({number : 1, sentence : "Sentence"});
		spy.getBindingContext.and.returnValue(oBindingContext);
		oBindingContext.getProperty.and.returnValue([]);
		oBindingContext.getModel.and.returnValue(oModel);
		oBindingContext.getPath.and.returnValue("path");
		expect(libUnderTest.linkFormatter.call(spy, ["sentence"], "Pseudonym")).toEqual([]);
	});
	
});
