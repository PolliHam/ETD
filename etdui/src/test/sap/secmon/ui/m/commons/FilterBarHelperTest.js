describe("FilterBarHelper", function() {
   var libUnderTest;
   jQuery.sap.require("test.TestHelper");
   jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
   var view, dialog, control, model, navigation, event, controller;
   beforeEach(function() {
       libUnderTest = sap.secmon.ui.m.commons.FilterBarHelper;
       view = test.TestHelper.createMockView();
       dialog = test.TestHelper.createMockDialog();
       control = test.TestHelper.createMockControl();
       model = test.TestHelper.createMockModel();
       event = test.TestHelper.createMockEvent();
       navigation = jasmine.createSpyObj("navigation", ["navigate"]);
       table = jasmine.createSpyObj("table", ["getColumns"]);
       controller = jasmine.createSpyObj("controller", ["byId", "getView", "getComponent",
           "getCommonText"]);
       controller.getView.and.returnValue(view);
      
   });
   describe("without initialized FilterBarHelper", function() {
       beforeEach(function() {
        });
       it("check initialize with model", function() {
           expect(function() {
               sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(controller, "changelogTable", "CONSTANT", navigation.navigate, ["Input"], [model]);
           }).not.toThrow();
           expect(navigation.navigate).not.toHaveBeenCalled();
           expect(controller.FilterInputIds).not.toBeUndefined();
           expect(controller.TableName).not.toBeUndefined();
           expect(controller.fnNavigation).not.toBeUndefined();
       });
       it("check initialize without model", function() {
           expect(function() {
               sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(controller, "changelogTable", "CONSTANT", navigation.navigate, ["Input"]);
           }).not.toThrow();
           expect(navigation.navigate).not.toHaveBeenCalled();
           expect(controller.FilterInputIds).not.toBeUndefined();
           expect(controller.TableName).not.toBeUndefined();
           expect(controller.fnNavigation).not.toBeUndefined();
       });
      
   });
   
   describe("With initialized FilterBarHelper", function() {
       var table, column;
      beforeEach(function() {
          spyOn(sap.ui.model, "Sorter");
          table = jasmine.createSpyObj("table", ["getColumns", "getModel", "getBinding", "getBindingInfo",
              "bindItems"]);
          column = jasmine.createSpyObj("column", ["setSorted", "setSortOrder", "getSortProperty"]);
          libUnderTest.initialize.call(controller, "changelogTable", "CONSTANT", navigation.navigate, ["Input"], [model]);
      }) ;
      it("Check on Search", function() {
          libUnderTest.onSearch.call(controller);
          expect(navigation.navigate).toHaveBeenCalled();
      }); 
      it("Check handleSort without beforeSort and descending", function(){
          table.getColumns.and.returnValue([column]);
          table.getBindingInfo.and.returnValue({template : control});
          event.getParameters.and.returnValue({column : column, sortOrder : sap.secmon.ui.m.commons.controls.SortOrder.Descending})
          view.byId.and.callFake(function(id) {
             switch(id) {
             case "page" : return control;
             case "changelogTable" : return table;
             } 
          });
          
          libUnderTest.handleSort.call(controller, event);
          expect(column.setSorted).toHaveBeenCalledWith(true);
          expect(column.setSortOrder).toHaveBeenCalledWith(sap.secmon.ui.m.commons.controls.SortOrder.Descending);
          expect(sap.ui.model.Sorter).toHaveBeenCalledWith(undefined, true);
      });
      it("Check handleSort without beforeSort and ascending", function(){
          table.getColumns.and.returnValue([column]);
          table.getBindingInfo.and.returnValue({template : control});
          event.getParameters.and.returnValue({column : column, sortOrder : sap.secmon.ui.m.commons.controls.SortOrder.Ascending})
          view.byId.and.callFake(function(id) {
             switch(id) {
             case "page" : return control;
             case "changelogTable" : return table;
             } 
          });
          
          libUnderTest.handleSort.call(controller, event);
          expect(column.setSorted).toHaveBeenCalledWith(true);
          expect(column.setSortOrder).toHaveBeenCalledWith(sap.secmon.ui.m.commons.controls.SortOrder.Ascending);
          expect(sap.ui.model.Sorter).toHaveBeenCalledWith(undefined, false);
      });
     it("setFiltersTest", function() {
         var filters = [];
         libUnderTest.setFilters.call(controller, filters);
         expect(controller.Filters).toBe(filters);
     });
     it("getFiltersTest", function() {
         var filters = [1,2,3];
         controller.Filters = filters;
         expect(libUnderTest.getFilters.call(controller, filters)).toBe(filters);
         
     });
     it("setFilterBarText", function() {
         
         var text = "This is a text";
         view.byId.and.returnValue(control);
         libUnderTest.setFilterBarText.call(controller, text);
         expect(control.setText).toHaveBeenCalledWith(text);
     });
     it("getFilterBar", function() {
         view.byId.and.returnValue(control);
         libUnderTest.getFilterBar.call(controller);
         expect(view.byId).toHaveBeenCalledWith("vsdFilterBar");
     });
    
     it("showFilterBar", function() {
         view.byId.and.returnValue(control);
         libUnderTest.showFilterBar.call(controller, true);
         expect(control.setVisible).toHaveBeenCalledWith(true);
     });
     it("showFilterBar (hide)", function() {
         view.byId.and.returnValue(control);
         libUnderTest.showFilterBar.call(controller, false);
         expect(control.setVisible).toHaveBeenCalledWith(false);
     });
     it("apply sorting", function() {
         table.getColumns.and.returnValue([column]);
         view.byId.and.returnValue(table);
         libUnderTest.applySorting.call(controller,"Id", true);
         expect(column.setSorted).not.toHaveBeenCalled();
     });
     it("getFilterInputIdsOfFilterBar", function() {
         var filterIds = [1,2,3];
         controller.FilterInputIds = filterIds;
         expect(libUnderTest.getFilterInputIdsOfFilterBar.call(controller)).toBe(filterIds);
         
     });

   });
   
});