describe("InvestigationCreatorDialog.controller", function() {
   var libUnderTest;
   jQuery.sap.require("test.TestHelper");
   var view, dialog, control, model;
   beforeEach(function() {
       libUnderTest = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorDialog"); 
       view = test.TestHelper.createMockView();
       dialog = test.TestHelper.createMockDialog();
       control = test.TestHelper.createMockControl();
       model = test.TestHelper.createMockModel();
   });
   
   it("openDialog with alerts without any models set", function() {
       spyOn($,"ajax");
       spyOn(sap.ui,"xmlfragment").and.returnValue(dialog);
       view.byId.and.returnValue(control);
       control.mBindingInfos = {value : {type : "String"}};
       view.getId.and.returnValue("TestParentView-Id");
       libUnderTest.openDialog(["Id1", "Id2"], view, function(oCreatedInvestigation) {
           fnSuccessCallback(oCreatedInvestigation);
       });
       expect(dialog.open).toHaveBeenCalled();
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"i18n");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"i18nCommon");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"enums");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"editModel");
   });
   it("openDialog with alerts with i18nCommon Model set", function() {
       spyOn($,"ajax");
       spyOn(sap.ui,"xmlfragment").and.returnValue(dialog);
       view.byId.and.returnValue(control);
       control.mBindingInfos = {value : {type : "String"}};
       view.getId.and.returnValue("TestParentView-Id");
       dialog.getModel.and.callFake(function(name) {
           switch(name) {
           case "i18nCommon" :
               return model;
           }
       });
       libUnderTest.openDialog(["Id1", "Id2"], view, function(oCreatedInvestigation) {
           fnSuccessCallback(oCreatedInvestigation);
       });
       expect(dialog.open).toHaveBeenCalled();
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"i18n");
       expect(dialog.setModel).not.toHaveBeenCalledWith(jasmine.any(Object),"i18nCommon");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"enums");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"editModel");
   });
   it("openDialog with alerts with enums Model set", function() {
       spyOn($,"ajax");
       spyOn(sap.ui,"xmlfragment").and.returnValue(dialog);
       view.byId.and.returnValue(control);
       control.mBindingInfos = {value : {type : "String"}};
       view.getId.and.returnValue("TestParentView-Id");
       dialog.getModel.and.callFake(function(name) {
           switch(name) {
           case "enums" :
               return model;
           }
       });
       libUnderTest.openDialog(["Id1", "Id2"], view, function(oCreatedInvestigation) {
           fnSuccessCallback(oCreatedInvestigation);
       });
       expect(dialog.open).toHaveBeenCalled();
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"i18n");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"i18nCommon");
       expect(dialog.setModel).not.toHaveBeenCalledWith(jasmine.any(Object),"enums");
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"editModel");
   });
   it("openDialog check HanaUsers", function() {
       spyOn($,"ajax");
       spyOn(sap.ui,"xmlfragment").and.returnValue(dialog);
       view.byId.and.returnValue(control);
       control.mBindingInfos = {value : {type : "String"}};
       view.getId.and.returnValue("TestParentView-Id");
       libUnderTest.openDialog(["Id1", "Id2"], view, function(oCreatedInvestigation) {
           fnSuccessCallback(oCreatedInvestigation);
       });
       expect($.ajax).toHaveBeenCalled();
       expect($.ajax.calls.mostRecent().args[0].url).toEqual("/sap/secmon/services/hanaUsers.xsodata/HanaUsers?$format=json");
       expect($.ajax.calls.mostRecent().args[0].async).toEqual(true);
       expect($.ajax.calls.mostRecent().args[0].type).toEqual("GET");
       $.ajax.calls.mostRecent().args[0].success({d : { results : "HANA Users"}});
       expect(dialog.setModel).toHaveBeenCalledWith(jasmine.any(Object),"hanaUsers");
   });
   
});