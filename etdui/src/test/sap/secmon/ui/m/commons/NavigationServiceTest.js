
describe("NavigationServiceTest", function(){
	jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
	jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
	
	var libUnderTest;
	var window;
	var navigationService;
	var container;
	//var sap = {};
	//sap.ushell = {};
	var open;
	
	afterEach(function() {
	});
	beforeEach(function() {
		//open = spyOn(window, "open").and.stub();
		//window.open = open;
		container = jasmine.createSpyObj("container", ["getService"]);
		
		//
		if (sap && !sap.ushell) {
			sap.ushell = {};
		}
		sap.ushell.Container = container;
		navigationService = jasmine.createSpyObj("navigationService",["toExternal"]);
		container.getService.and.returnValue(navigationService);
		//jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
		//libUnderTest = sap.secmon.ui.commons.NavigationService();
	});
	it("openBrowser with two timestamps", function() {
		var windowObject = jasmine.createSpyObj("windowObject",["open"]); 
		
		sap.secmon.ui.m.commons.NavigationService.openBrowseUI("4711" , new Date(), new Date(), windowObject);
		
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("/sap/secmon/ui/browse/");
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("sap-language=en");
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("to=");
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("from=");
		
	});
	it("openBrowser without from", function() {
		var windowObject = jasmine.createSpyObj("windowObject",["open"]); 
		
		sap.secmon.ui.m.commons.NavigationService.openBrowseUI("4711" , null, new Date(), windowObject);
		
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("/sap/secmon/ui/browse/");
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("sap-language=en");
		expect(windowObject.open.calls.argsFor(0)[0]).not.toContain("to=");
		expect(windowObject.open.calls.argsFor(0)[0]).not.toContain("from=");
		
	});
	it("openBrowser without to timestamp", function() {
		var windowObject = jasmine.createSpyObj("windowObject",["open"]); 
		
		sap.secmon.ui.m.commons.NavigationService.openBrowseUI("4711" , new Date(), null, windowObject);
		
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("/sap/secmon/ui/browse/");
		expect(windowObject.open.calls.argsFor(0)[0]).toContain("sap-language=en");
		expect(windowObject.open.calls.argsFor(0)[0]).not.toContain("to=");
		expect(windowObject.open.calls.argsFor(0)[0]).not.toContain("from=");
		
	});
	it("openCaseFile with id", function() {
        sap.secmon.ui.m.commons.NavigationService.openCaseFile("4711");
        var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
        expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
        expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
        expect(argumentVar.target.shellHash).toEqual("#CaseFile-show&/CaseFile/4711");   
    } );
	it("openLogViewerForAlert with alertId, alertType and chartId", function() {
		sap.secmon.ui.m.commons.NavigationService.openLogViewerForAlert("4711", "type", "0815");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#SemanticEvents-show&/?alert=4711&type=type&chartId=0815");	
	} );
	it("openLogViewerForAlert with alertId, without alertType and with chartId", function() {
		sap.secmon.ui.m.commons.NavigationService.openLogViewerForAlert("4711", null, "0815");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#SemanticEvents-show&/?alert=4711&chartId=0815");	
	} );
	it("openLogViewerForAlert with alertId, without alertType and chartId", function() {
		sap.secmon.ui.m.commons.NavigationService.openLogViewerForAlert("4711");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#SemanticEvents-show&/?alert=4711");	
	} );
	it("openAnomalyPattern", function() {
		sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern("4711");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AnomalyDetectionPattern-show&/configurePattern/4711");	
	});
	
	it("openAnomalyEvaluation", function() {
		sap.secmon.ui.m.commons.NavigationService.openAnomalyEvaluation("4711");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AnomalyDetectionPattern-show&/configurePattern/evaluation/4711");	
	});
	it("openAnomalyAnalysis with patternId, from and toTimestamp", function() {
		var fromDate = new Date();
		var toDate = new Date();
		sap.secmon.ui.m.commons.NavigationService.openAnomalyAnalysis("4711", fromDate, toDate);
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AnomalyDetectionPattern-show&/analysePattern/4711?fromTimestamp=" + fromDate.toISOString() + "&toTimestamp=" + toDate.toISOString());			
	});
	it("openAnomalyAnalysis without patternId, but with from and toTimestamp", function() {
		var fromDate = new Date();
		var toDate = new Date();
		sap.secmon.ui.m.commons.NavigationService.openAnomalyAnalysis(null, fromDate, toDate);
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AnomalyDetectionPattern-show&/analysePattern?fromTimestamp=" + fromDate.toISOString() + "&toTimestamp=" + toDate.toISOString());			
	});
	it("openAnomalyAnalysis with patternID without from and toTimestamp", function() {
		sap.secmon.ui.m.commons.NavigationService.openAnomalyAnalysis("4711");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AnomalyDetectionPattern-show&/analysePattern/4711");			
	});
	it("openAnomalyAnalysis without any parameter", function() {
		sap.secmon.ui.m.commons.NavigationService.openAnomalyAnalysis();
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AnomalyDetectionPattern-show&/analysePattern");			
	});
	it("openAlertInMonitoring", function() {
		var windowObject = jasmine.createSpyObj("windowObject",["open"]); 
		sap.secmon.ui.m.commons.NavigationService.openAlertInMonitoring("4711", windowObject);
		expect(windowObject.open.calls.argsFor(0)[0]).toEqual("/sap/secmon/ui/monitoring/?alertId=4711&sap-language=en");	
	});
	it("navigateToAlertsOfPattern", function() {
		sap.secmon.ui.m.commons.NavigationService.navigateToAlertsOfPattern("4711", "filter");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#AlertsList-show&/?patternId=4711&filter");			
	});
	it("navigateToPattern", function() {
		sap.secmon.ui.m.commons.NavigationService.navigateToPattern("4711", "FLAB");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).not.toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("semanticObject")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("action")).toBeTruthy();
		expect(argumentVar.target.semanticObject).toEqual("Patterns");
		expect(argumentVar.target.action).toEqual("show");			
	});
	
	it("openLogViewerWithParams ", function() {
		sap.secmon.ui.m.commons.NavigationService.openLogViewerWithParams("params");
		var argumentVar = navigationService.toExternal.calls.argsFor(0)[0];
		expect(argumentVar.hasOwnProperty("target")).toBeTruthy();
		expect(argumentVar.target.hasOwnProperty("shellHash")).toBeTruthy();
		expect(argumentVar.target.shellHash).toEqual("#SemanticEventFS-show&/?params");	
	} );
	it("openLogViewerWithParams in new window", function() {
		var windowObject = jasmine.createSpyObj("windowObject",["open"]); 
		sap.secmon.ui.m.commons.NavigationService.openLogViewerWithParams("params", true, windowObject);
		expect(navigationService.toExternal).not.toHaveBeenCalled();
		expect(windowObject.open.calls.argsFor(0)[0]).toEqual("/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad&sap-language=en#SemanticEventFS-show&/?params");
	} );
	describe("getLaunchpadUrl", function() {
	    it("getLaunchPadUrl with allowed language", function() {
	       var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
	       configuration.getLanguage.and.returnValue("ru");
	       spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
	       var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl();
	       expect(url).toContain("sap-language=ru");
	    });
       it("getLaunchPadUrl with not allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("de");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl();
           expect(url).toContain("sap-language=en");
        });

	});
	describe("alertUrl", function() {
	    var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
	    it("alertUrl with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.alertURL(CommonFunctions.hexToBase64('11223344'));
           expect(url).toContain("sap-language=ru");
           expect(url).toContain("AlertDetails-show?alert=11223344");
	    });
        it("alertUrl with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.alertURL(CommonFunctions.hexToBase64('11223344'));
            expect(url).toContain("sap-language=en");
            expect(url).toContain("AlertDetails-show?alert=11223344");
         });
	});
	
	describe("openAlertsOfPatternURL", function(){
	    var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
	    it("URL for open alerts for a given pattern, with allowed language", function(){
	           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
	           configuration.getLanguage.and.returnValue("ru");
	           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
	           var url = sap.secmon.ui.m.commons.NavigationService.openAlertsOfPatternURL(CommonFunctions.hexToBase64('11223344'));
	           expect(url).toContain("sap-language=ru");
	           expect(url).toContain("AlertsList-show&/?patternId=11223344&status=OPEN&orderBy=creationDate&orderDesc=true");	        
	    });
	    it("URL for open alerts for a given pattern, with non-allowed language", function(){
               var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
               configuration.getLanguage.and.returnValue("es");
               spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
               var url = sap.secmon.ui.m.commons.NavigationService.openAlertsOfPatternURL(CommonFunctions.hexToBase64('11223344'));
               expect(url).toContain("sap-language=en");
               expect(url).toContain("AlertsList-show&/?patternId=11223344&status=OPEN&orderBy=creationDate&orderDesc=true");         
        });
	});
	
	   describe("lastDaysAlertsOfPatternURL", function(){
	        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
	        it("URL for open alerts for a given pattern, with allowed language", function(){
	               var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
	               configuration.getLanguage.and.returnValue("ru");
	               spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
	               var url = sap.secmon.ui.m.commons.NavigationService.lastDaysAlertsOfPatternURL(CommonFunctions.hexToBase64('11223344'));
	               expect(url).toContain("sap-language=ru");
	               expect(url).toContain("AlertsList-show&/?patternId=11223344&timeSelectionType=relative&timeLast=1&timeType=days&orderBy=creationDate&orderDesc=true");           
	        });
	        it("URL for open alerts for a given pattern, with non-allowed language", function(){
	               var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
	               configuration.getLanguage.and.returnValue("es");
	               spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
	               var url = sap.secmon.ui.m.commons.NavigationService.lastDaysAlertsOfPatternURL(CommonFunctions.hexToBase64('11223344'));
	               expect(url).toContain("sap-language=en");
	               expect(url).toContain("AlertsList-show&/?patternId=11223344&timeSelectionType=relative&timeLast=1&timeType=days&orderBy=creationDate&orderDesc=true");         
	        });
	    });
	
    describe("patternUrl", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        it("patternUrl with guid and allowed language and non anomaly pattern", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.patternURL(CommonFunctions.hexToBase64('11223344'), "No");
           expect(url).toContain("sap-language=ru");
           expect(url).toContain("#Patterns-show?patternId=11223344");
        });
        it("patternUrl with guid and not allowed language and non anomaly pattern", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.patternURL(CommonFunctions.hexToBase64('11223344'), "No");
            expect(url).toContain("sap-language=en");
            expect(url).toContain("#Patterns-show?patternId=11223344");
         });
        it("patternUrl with guid and allowed language and anomaly pattern", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("ru");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.patternURL(CommonFunctions.hexToBase64('11223344'), "True");
            expect(url).toContain("sap-language=ru");
            expect(url).toContain("#AnomalyDetectionPattern-show&/configurePattern/11223344");
         });
         it("patternUrl with guid and not allowed language non anomaly pattern", function() {
             var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
             configuration.getLanguage.and.returnValue("fr");
             spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
             var url = sap.secmon.ui.m.commons.NavigationService.patternURL(CommonFunctions.hexToBase64('11223344'), "True");
             expect(url).toContain("sap-language=en");
             expect(url).toContain("#AnomalyDetectionPattern-show&/configurePattern/11223344");
          });
         it("patternUrl with guid and allowed language and anomaly pattern and yes", function() {
             var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
             configuration.getLanguage.and.returnValue("ru");
             spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
             var url = sap.secmon.ui.m.commons.NavigationService.patternURL(CommonFunctions.hexToBase64('11223344'), "Yes");
             expect(url).toContain("sap-language=ru");
             expect(url).toContain("#AnomalyDetectionPattern-show&/configurePattern/11223344");
          });
          it("patternUrl with guid and not allowed language non anomaly pattern and yes", function() {
              var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
              configuration.getLanguage.and.returnValue("fr");
              spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
              var url = sap.secmon.ui.m.commons.NavigationService.patternURL(CommonFunctions.hexToBase64('11223344'), "Yes");
              expect(url).toContain("sap-language=en");
              expect(url).toContain("#AnomalyDetectionPattern-show&/configurePattern/11223344");
           });
   });
    describe("valuelistUrl", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var expectedUrl = "#Valuelist-show&/valuelist/";
        it("valuelistURL  with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.valuelistURL (CommonFunctions.hexToBase64('11223344'));
           expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl);
           expect(url).toContain("Header(X'11223344')");
        });
        it("valuelistURL  with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.valuelistURL (CommonFunctions.hexToBase64('11223344'));
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl);
            expect(url).toContain("Header(X'11223344')");
         });
    });
    describe("patternExecution ", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var expectedUrl = "#PatternExecutionResults-show&/executionResult/";
        it("patternExecution with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.patternExecution (CommonFunctions.hexToBase64('11223344'));
           expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl + 11223344);
        });
        it("patternExecution with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.patternExecution(CommonFunctions.hexToBase64('11223344'));
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + 11223344);
         });
    });
    describe("investigationsOfAlertURL", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var expectedUrl = "#AlertDetails-show?alert=";
        it("patternExecution with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.investigationsOfAlertURL(CommonFunctions.hexToBase64('11223344'));
           expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl + 11223344);
        });
        it("patternExecution with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.investigationsOfAlertURL(CommonFunctions.hexToBase64('11223344'));
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + 11223344);
         });
    });
    describe("investigationURL", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var expectedUrl = "#InvestigationDetails-show?investigation=";
        it("patternExecution with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.investigationURL(CommonFunctions.hexToBase64('11223344'));
           expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl + 11223344);
        });
        it("patternExecution with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.investigationURL(CommonFunctions.hexToBase64('11223344'));
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + 11223344);
         });
    });
    describe("investigationFileURL", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var expectedUrl = "/sap/secmon/services/ui/m/invest/InvestigationDocument.xsjs?Id=";
        it("investigationFileURL with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.investigationFileURL(CommonFunctions.hexToBase64('11223344'));
           //expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl + 11223344);
        });
        it("investigationFileURL with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.investigationFileURL(CommonFunctions.hexToBase64('11223344'));
            //expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + 11223344);
         });
    });
    describe("systemURL", function() {
      
        var expectedUrl = "#System-show?system=";
        it("systemURL with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.systemURL ("YI3", "ABAP");
           expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl + "YI3");
        });
        it("systemURL with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.systemURL ("YI3", "ABAP");
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + "YI3");
         });
        
        it("systemURL with guid and tab. In not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.systemURL ("YI3", "ABAP", "myTAB");
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + "YI3");
            expect(url).toContain("&tab=myTAB");
         });
    });
    
    describe("triggeringEventsURL", function() {
        var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        var expectedUrl = "#SemanticEvents-show&/?alert=";
        it("triggeringEventsURL with guid and allowed language", function() {
           var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
           configuration.getLanguage.and.returnValue("ru");
           spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
           var url = sap.secmon.ui.m.commons.NavigationService.triggeringEventsURL(CommonFunctions.hexToBase64("1234"));
           expect(url).toContain("sap-language=ru");
           expect(url).toContain(expectedUrl + "1234");
        });
        it("triggeringEventsURL with guid and not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.triggeringEventsURL(CommonFunctions.hexToBase64("1234"));
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + "1234");
         });
        
        it("triggeringEventsURL with guid and optional chart ID. In not allowed language", function() {
            var configuration = jasmine.createSpyObj("configuration", ["getLanguage"]);
            configuration.getLanguage.and.returnValue("fr");
            spyOn(sap.ui.getCore(),"getConfiguration").and.returnValue(configuration); 
            var url = sap.secmon.ui.m.commons.NavigationService.triggeringEventsURL(CommonFunctions.hexToBase64("1234"), CommonFunctions.hexToBase64("2244"));
            expect(url).toContain("sap-language=en");
            expect(url).toContain(expectedUrl + "1234" + "&type=ANOMALY&chartId=" + "2244");
         });
    });
    
	
});