describe("SaveAsDialog.controller Tests", function(){
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.valuelist.view.SaveAsDialog",
        type : "controller"
    });
    jQuery.sap.require("test.TestHelper");
    jQuery.sap.require("sap.ui.core.UIComponent");
    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, uicomponent, event, nameSpaceModel, valueCountModel, component,
        item, promise;
    afterEach(function() {
    });
    beforeEach(function() {
         libUnderTest = sap.ui.controller("sap.secmon.ui.m.valuelist.view.SaveAsDialog");
         view = test.TestHelper.createMockView();
         dialog = test.TestHelper.createMockDialog();
         parentView = test.TestHelper.createMockView();
         bindingContext = test.TestHelper.createMockBindingContext();
         spyOn(libUnderTest, "getView").and.returnValue(view);
         dialog.getParent.and.returnValue(view);
         event = test.TestHelper.createMockEvent();
         select = jasmine.createSpyObj("select", ["removeItem", "bindAggregation", "getSelectedItem"]);
         item = jasmine.createSpyObj("item", ["getProperty"]);
         sap.ui.Device.system.phone = false;
         nameSpaceModel = test.TestHelper.createMockModel();
         valueCountModel = test.TestHelper.createMockModel();
         component = test.TestHelper.createMockComponent();
         promise = test.TestHelper.createMockPromise();
         spyOn(libUnderTest, "getComponent").and.returnValue(component);
    });
    
    it("openDialog with dialog", function() {
        libUnderTest.oDialog = dialog;
        parentView.getBindingContext.and.returnValue(bindingContext);
        bindingContext.getObject.and.returnValue({Id : "4567", ListName : 'Test List', Description : "This is a test", NameSpace : 'http://test'});
        parentView.getModel.and.callFake(function(x) {
            switch(x) {
            case "nameSpaces":
                return nameSpaceModel;
                break;
            case "valueCount":
                return valueCountModel;
                break;
            }
        })  
        parentView.byId.and.returnValue(select);
        libUnderTest.openDialog.call(libUnderTest, '1234', parentView, function() {});
        expect(dialog.setModel).toHaveBeenCalledWith(nameSpaceModel, "nameSpaces");
        expect(dialog.setModel).toHaveBeenCalledWith(valueCountModel, "valueCount");
        expect(dialog.open).toHaveBeenCalled();
    });
    it("open dialog without dialog", function() {
        spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
        parentView.getBindingContext.and.returnValue(bindingContext);
        bindingContext.getObject.and.returnValue({Id : "4567", ListName : 'Test List', Description : "This is a test", NameSpace : 'http://test'});
        parentView.getModel.and.callFake(function(x) {
            switch(x) {
            case "nameSpaces":
                return nameSpaceModel;
                break;
            case "valueCount":
                return valueCountModel;
                break;
            }
        })  
        parentView.byId.and.returnValue(select);
        libUnderTest.openDialog.call(libUnderTest, '1234', parentView, function() {});
        expect(dialog.setModel).toHaveBeenCalledWith(nameSpaceModel, "nameSpaces");
        expect(dialog.setModel).toHaveBeenCalledWith(valueCountModel, "valueCount");
        expect(dialog.open).toHaveBeenCalled();
        expect(parentView.addDependent).toHaveBeenCalled();
    });
    it("onSaveNewVL event handler", function() {
        
        libUnderTest.oDialog = dialog;
        libUnderTest.oParentView = parentView;
        spyOn($, "ajax").and.returnValue(promise);
        var i18nModel = test.TestHelper.createMockModel(),
            localModel = test.TestHelper.createMockModel();
        select.getSelectedItem.and.returnValue(item);
        localModel.getData.and.returnValue({Id : "4567", ListName : 'Test List', Description : "This is a test", NameSpace : 'http://test'});
        parentView.byId.and.returnValue(select);
        dialog.getModel.and.returnValue(localModel);
        parentView.getBindingContext.and.returnValue(bindingContext);
        bindingContext.getObject.and.returnValue({Id : "4567", ListName : 'Test List', Description : "This is a test", NameSpace : 'http://test'});
        parentView.getModel.and.callFake(function(x) {
            switch(x) {
            case "i18n":
                return i18nModel;
                break;
             case "nameSpaces":
                return nameSpaceModel;
                break;
            case "valueCount":
                return valueCountModel;
                break;
            }
        })  
        libUnderTest.onSaveNewVL.call(libUnderTest, event);
        expect($.ajax).toHaveBeenCalled();
    });
});
