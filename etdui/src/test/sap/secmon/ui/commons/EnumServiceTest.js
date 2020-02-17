describe("EnumService Test", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require("test.TestHelper");
    function requireEnumService(doneFunction, finshFunction) {
        var done = doneFunction, finish = finshFunction;
        if (sap && sap.secmon && sap.secmon.ui && sap.secmon.ui.commons && sap.secmon.ui.commons.EnumService) {
            delete  sap.secmon.ui.commons.EnumService;
         }
         sap.ui.require(['sap/secmon/ui/commons/EnumService'], function(enumService) {
             sap.secmon.ui.commons.EnumService = enumService;
             if (finish) {
                 finish (enumService);
             }
             done();
         });        
    }
    beforeAll(function(done) {
        requireEnumService(done);
    });
    
    var libUnderTest;
    var oTextBundle = test.TestHelper.createMockTextBundle();;
    afterEach(function () {
        delete sap.secmon.ui.commons.EnumService.prototype.singletoninstance;
    });
    beforeEach(function (done) {
        requireEnumService(done, function(enumService) {
            delete enumService.prototype.singletoninstance;
            libUnderTest = new enumService();
        });
        
        spyOn(jQuery.sap, "resources").and.returnValue(oTextBundle);
       
    });
    it("loadEnums with success and no data", function(){
        var callObj;
        spyOn($, "ajax").and.callFake(function(obj) {
           callObj = obj;
           obj.success(null, "OK", {}); 
        });
        
        expect(libUnderTest.loadEnums("sap.secmon")).toBe(null);
        expect($.ajax).toHaveBeenCalled();
        expect(callObj.url).toBe("/sap/secmon/services/genericEnum.xsodata/Enum?$format=json&$filter=startswith(Package,'sap.secmon')");
        
    });
    it("loadEnums with success and one object", function(){
        var callObj;
        spyOn($, "ajax").and.callFake(function(obj) {
           callObj = obj;
           obj.success({d : {results : [{Package: "sap.secmon", Object : "Pattern", Attribute : "Type", Key : "ANOMALY", Language : " ", SortOrder : 1, Value : "Anomaly", TextKey : "12345", editable: false}]}}, "OK", {}); 
        });
        var returnObj = libUnderTest.loadEnums("sap.secmon");
        
        expect(returnObj).toEqual({"sap.secmon" : {Pattern : {Type : {enumValues : [{Key : "ANOMALY", Value : "Anomaly", SortOrder: 1, editable: false}], keyValueMap : {ANOMALY : "Anomaly"}}}}});
        expect($.ajax).toHaveBeenCalled();
        expect(callObj.url).toBe("/sap/secmon/services/genericEnum.xsodata/Enum?$format=json&$filter=startswith(Package,'sap.secmon')");
        expect(oTextBundle.getText).toHaveBeenCalled();
    });
    it("loadEnums with success and two objects", function(){
        var callObj;
        spyOn($, "ajax").and.callFake(function(obj) {
           callObj = obj;
           obj.success({d : {results : [{Package: "sap.secmon", Object : "Pattern", Attribute : "Type", Key : "ANOMALY", Language : " ", SortOrder : 1, Value : "Anomaly", TextKey : "12345", editable: true},
               {Package: "sap.secmon", Object : "Pattern", Attribute : "Type", Key : "FLAB", Language : " ", SortOrder : 2, Value : "Forensic Lab", TextKey : "12346", editable: false}]}}, "OK", {}); 
        });
        var returnObj = libUnderTest.loadEnums("sap.secmon");
        
        expect(returnObj).toEqual({"sap.secmon" : {Pattern : {Type : {enumValues : [{Key : "ANOMALY", Value : "Anomaly", SortOrder: 1, editable: true},{Key : "FLAB", Value : "Forensic Lab", SortOrder: 2, editable: false}], keyValueMap : {ANOMALY : "Anomaly", FLAB : "Forensic Lab"}}}}});
        expect($.ajax).toHaveBeenCalled();
        expect(callObj.url).toBe("/sap/secmon/services/genericEnum.xsodata/Enum?$format=json&$filter=startswith(Package,'sap.secmon')");
        expect(oTextBundle.getText).toHaveBeenCalled();
    });
    it("loadEnumsAsync with single package success and no data", function(){
        var callObj;
        spyOn($, "ajax").and.callFake(function(obj) {
           callObj = obj;
           obj.success({d : {results : []}}, "OK", {}); 
        });
        var promise = libUnderTest.loadEnumsAsync("sap.secmon");
        promise.done(function(data) {
           expect(data).toEqual({}); 
        });
        expect(promise).not.toBe(null);
        expect($.ajax).toHaveBeenCalled();
        expect(callObj.url).toBe("/sap/secmon/services/genericEnum.xsodata/Enum?$format=json&$filter=startswith(Package,'sap.secmon')");
        
    });
    it("loadEnumsAsync with multiple packages success and no data", function(){
        var callObj;
        spyOn($, "ajax").and.callFake(function(obj) {
           callObj = obj;
           obj.success({d : {results : []}}, "OK", {}); 
        });
        var promise = libUnderTest.loadEnumsAsync("sap.secmon.ui,sap.secmon.services");
        promise.done(function(data) {
           expect(data).toEqual({}); 
        });
        expect(promise).not.toBe(null);
        expect($.ajax).toHaveBeenCalled();
        expect(callObj.url).toBe("/sap/secmon/services/genericEnum.xsodata/Enum?$format=json&$filter=startswith(Package,'sap.secmon.ui')%20or%20startswith(Package,'sap.secmon.services')");
        
    });
    
    
    it("convert enum tree back to flat list", function(){
        var oEnumTree = {
                    "sap.secmon.services.ui.m.invest": {  // Package
                            "Investigation": {                // Object
                                "Severity": {                 // Attribute
                                    "enumValues": [
                                        {
                                            "Key": "LOW",
                                            "Value": "Low",
                                            SortOrder: 1,
                                            changed: true
                                        },
                                        {
                                            "Key": "MEDIUM",
                                            "Value": "Medium",
                                            SortOrder: 2,
                                            deleted: true
                                        },
                                    ],
                                    "keyValueMap": {
                                        "LOW": "Low",
                                        "MEDIUM": "Medium"
                                    }
                                },
                                "Status": {
                                    "enumValues": [ {
                                        "Key": "START",
                                        "Value": "Start",
                                        SortOrder: 0,
                                        isNew: true
                                    },
                                    {
                                        "Key": "END",
                                        "Value": "End",
                                        SortOrder: 1
                                    },
                                    ],
                                    "keyValueMap": {
                                        "START" : "Start",
                                        "END" :  "End"
                                    }
                                }
                            }
                        }
                        };
       var aFlatList = libUnderTest.buildFlatEnums(oEnumTree);
       expect(aFlatList).not.toBeNull();
       expect(aFlatList.length).toBe(4);
       var oSeverityLow = aFlatList[0];
       var oSeverityMedium = aFlatList[1];
       var oStatusStart = aFlatList[2];
       var oStatusEnd = aFlatList[3];
       
       expect(oSeverityLow.Package).toBe("sap.secmon.services.ui.m.invest");
       expect(oSeverityMedium.Package).toBe("sap.secmon.services.ui.m.invest");
       expect(oStatusStart.Package).toBe("sap.secmon.services.ui.m.invest");
       expect(oStatusEnd.Package).toBe("sap.secmon.services.ui.m.invest");
       
       expect(oSeverityLow.Object).toBe("Investigation");
       expect(oSeverityMedium.Object).toBe("Investigation");
       expect(oStatusStart.Object).toBe("Investigation");
       expect(oStatusEnd.Object).toBe("Investigation");
       
       expect(oSeverityLow.Attribute).toBe("Severity");
       expect(oSeverityMedium.Attribute).toBe("Severity");
       expect(oStatusStart.Attribute).toBe("Status");
       expect(oStatusEnd.Attribute).toBe("Status");
       
       // Key, Value, SortOrder, isNew, changed, deleted
       expect(oSeverityLow.Key).toBe("LOW");
       expect(oSeverityMedium.Key).toBe("MEDIUM");
       expect(oStatusStart.Key).toBe("START");
       expect(oStatusEnd.Key).toBe("END");
       
       expect(oSeverityLow.Value).toBe("Low");
       expect(oSeverityMedium.Value).toBe("Medium");
       expect(oStatusStart.Value).toBe("Start");
       expect(oStatusEnd.Value).toBe("End");
       
       expect(oSeverityLow.SortOrder).toBe(1);
       expect(oSeverityMedium.SortOrder).toBe(2);
       expect(oStatusStart.SortOrder).toBe(0);
       expect(oStatusEnd.SortOrder).toBe(1);
       
       expect(oSeverityLow.isNew).not.toBe(true);
       expect(oSeverityMedium.isNew).not.toBe(true);
       expect(oStatusStart.isNew).toBe(true);
       expect(oStatusEnd.isNew).not.toBe(true);
       
       expect(oSeverityLow.changed).toBe(true);
       expect(oSeverityMedium.changed).not.toBe(true);
       expect(oStatusStart.changed).not.toBe(true);
       expect(oStatusEnd.changed).not.toBe(true);
       
       expect(oSeverityLow.deleted).not.toBe(true);
       expect(oSeverityMedium.deleted).toBe(true);
       expect(oStatusStart.deleted).not.toBe(true);
       expect(oStatusEnd.deleted).not.toBe(true);
    });

});
