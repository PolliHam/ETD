jQuery.sap.require("sap.secmon.ui.loglearning.util.AnnotationsListConverter");
jQuery.sap.require("sap.secmon.ui.loglearning.Constants");


describe("AnnotationsListConverter Tests", function(){
    var libUnderTest;

    beforeEach(function() {
        libUnderTest = sap.secmon.ui.loglearning.util.AnnotationsListConverter;
    });
    
    
    it("sort list of annotations of several entry types, especially: logically deleted annotations must be put to end of list.", function() {
        var aUnsortedList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer", Action: 'REMOVE'},
                             {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 5, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 7, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 13, Type: "BlankOrPunctuation", FixedValue: "%", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.List", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 17, Type: "Integer", Action: 'REMOVE'},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.List", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 16, Type: "BlankOrPunctuation", FixedValue: "% % %", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 17, Type: "Integer", Action: ""}];
        
        var aSortedList = aUnsortedList.sort(libUnderTest.ANNOTATION_COMPARATOR);
        
        
        var aExpectedSortedList = [
                                   {"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},    
                                   {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.List", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                                   {"EntryTypeId.Id": "AA", Position: 17, Type: "Integer", Action: 'REMOVE'},
                                   
                                   {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 5, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 7, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 13, Type: "BlankOrPunctuation", FixedValue: "%", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.List", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 15, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 16, Type: "BlankOrPunctuation", FixedValue: "% % %", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 17, Type: "Integer", Action: ""},
                                   {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer", Action: 'REMOVE'},
                                   ];
        
        expect(aSortedList.length).toEqual(aExpectedSortedList.length);
        compare2Lists(libUnderTest, aSortedList, aExpectedSortedList);
        
    });
    
    
    it("complete the annotations list for one entry type with blankOrPunctuation annotation", function() {
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>;)";
        var aIncompleteList = [{Position: 1, Type: "Integer", Action: ""},
                               {Position: 2, Type: "Integer", Action: ""},
                               {Position: 3, Type: "Integer", Action: ""},
                               {Position: 4, Type: "Integer", Action: ""},
                               {Position: 5, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                               {Position: 6, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                               {Position: 7, Type: "KeyValue.List", Action: ""},
                               {Position: 8, Type: "Integer", Action: ""},
                               {Position: 9, Type: "Integer", Action: ""}];
        
        var aCompleteList = libUnderTest.completeList(aIncompleteList, sMarkup);
        
        var aExpectedCompleteList = [{Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                     {Position: 2, Type: "Integer", Action: ""},
                                     {Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                     {Position: 4, Type: "Integer", Action: ""},
                                     {Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                     {Position: 6, Type: "Integer", Action: ""},
                                     {Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                     {Position: 8, Type: "Integer", Action: ""},
                                     {Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                                     {Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                                     {Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                                     {Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                                     {Position: 13, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                                     {Position: 14, Type: "KeyValue.List", Action: ""},
                                     {Position: 15, Type: "Integer", Action: ""},
                                     {Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                                     {Position: 17, Type: "Integer", Action: ""},
                                     {Position: 18, Type: "BlankOrPunctuation", FixedValue: ";)", Action: ""}];
        
       expect(aCompleteList.length).toEqual(aExpectedCompleteList.length);
       compare2Lists(libUnderTest, aCompleteList, aExpectedCompleteList);
       
    });
    
    
    it("complete a joined annotations list for several entry types with corresponding blankOrPunctuation annotation", function() {
        // input list is unsorted
        var aIncompleteList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 1, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 3, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 3, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 5, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 5, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 6, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 6, Type: "Word", FixedValue: "CONSTANT2", Action: ""},

                               {"EntryTypeId.Id": "AA", Position: 7, Type: "KeyValue.List", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 7, Type: "KeyValue.List", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer", Action: ""},
                               {"EntryTypeId.Id": "BB", Position: 9, Type: "Integer", Action: ""}];
        
        var sMarkup1 = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var sMarkup2 = "&lt;<Integer>+ <Integer>+ <Integer>+ <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>% % %<Integer>";
        
        var aCompleteList = libUnderTest.completeAllAnnotationsOfRun(aIncompleteList, 
                    [{"Id": "AA", Markup: sMarkup1},
                     {"Id": "BB", Markup: sMarkup2}]);
        
        // the output list should be sorted
        var aExpectedCompleteList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.List", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                                     {"EntryTypeId.Id": "AA", Position: 17, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 5, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 7, Type: "BlankOrPunctuation", FixedValue: "+ ", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 10, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.List", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 15, Type: "Integer", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 16, Type: "BlankOrPunctuation", FixedValue: "% % %", Action: ""},
                                     {"EntryTypeId.Id": "BB", Position: 17, Type: "Integer", Action: ""}];
        
       expect(aCompleteList.length).toEqual(aExpectedCompleteList.length);
       compare2Lists(libUnderTest, aCompleteList, aExpectedCompleteList);
      
    });

    it("strip a complete list and remove blankOrPunctuation annotations", function() {
        var aCompleteList = [{Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {Position: 2, Type: "Integer"},
                             {Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 4, Type: "Integer"},
                             {Position: 5, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 6, Type: "Integer"},
                             {Position: 7, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 8, Type: "Integer"},
                             {Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {Position: 14, Type: "KeyValue.List"},
                             {Position: 15, Type: "Integer"},
                             {Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {Position: 17, Type: "Integer"}];
        
        var aIncompleteList = libUnderTest.stripBlanksAndPunctuations(aCompleteList);
        
        var aExpectedIncompleteList = [{Position: 1, Type: "Integer"},
                                       {Position: 2, Type: "Integer"},
                                       {Position: 3, Type: "Integer"},
                                       {Position: 4, Type: "Integer"},
                                       {Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                                       {Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                                       {Position: 7, Type: "KeyValue.List"},
                                       {Position: 8, Type: "Integer"},
                                       {Position: 9, Type: "Integer"}];
        
        expect(aIncompleteList.length).toEqual(aExpectedIncompleteList.length);
        compare2Lists(libUnderTest, aIncompleteList, aExpectedIncompleteList);
    });
    
    
    it("strip a joined list of complete annotations of several entry types and remove blankOrPunctuation annotations", function() {
        // the input list may be unsorted
        var aCompleteList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "+ "},
                             {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: 5, Type: "BlankOrPunctuation", FixedValue: "+ "},
                             {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: 7, Type: "BlankOrPunctuation", FixedValue: "+ "},
                             {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {"EntryTypeId.Id": "BB", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {"EntryTypeId.Id": "BB", Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {"EntryTypeId.Id": "BB", Position: 13, Type: "BlankOrPunctuation", FixedValue: "%"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.List"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {"EntryTypeId.Id": "AA", Position: 17, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.List"},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 16, Type: "BlankOrPunctuation", FixedValue: "% % %"},
                             {"EntryTypeId.Id": "BB", Position: 17, Type: "Integer"}];
        
        var aIncompleteList = libUnderTest.stripBlanksAndPunctuations(aCompleteList);
        
        
        var aExpectedIncompleteList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "Integer"},
                                       {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer"},
                                       {"EntryTypeId.Id": "AA", Position: 3, Type: "Integer"},
                                       {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer"},
                                       {"EntryTypeId.Id": "AA", Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                                       {"EntryTypeId.Id": "AA", Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                                       {"EntryTypeId.Id": "AA", Position: 7, Type: "KeyValue.List"},
                                       {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer"},
                                       {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer"},
                                       {"EntryTypeId.Id": "BB", Position: 1, Type: "Integer"},
                                       {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer"},
                                       {"EntryTypeId.Id": "BB", Position: 3, Type: "Integer"},
                                       {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer"},
                                       {"EntryTypeId.Id": "BB", Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                                       {"EntryTypeId.Id": "BB", Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                                       {"EntryTypeId.Id": "BB", Position: 7, Type: "KeyValue.List"},
                                       {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer"},
                                       {"EntryTypeId.Id": "BB", Position: 9, Type: "Integer"}];
        
        expect(aIncompleteList.length).toEqual(aExpectedIncompleteList.length);
        compare2Lists(libUnderTest, aIncompleteList, aExpectedIncompleteList);
    });
    
    it("test full-cycle: conversion and subsequent reverse conversion must result in identity operation", function() {
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var aIncompleteList = [{Position: 1, Type: "Integer"},
                               {Position: 2, Type: "Integer"},
                               {Position: 3, Type: "Integer"},
                               {Position: 4, Type: "Integer"},
                               {Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {Position: 7, Type: "KeyValue.List"},
                               {Position: 8, Type: "Integer"},
                               {Position: 9, Type: "Integer"}];
        
        var aCompleteList = libUnderTest.completeList(aIncompleteList, sMarkup);
        
        var sMarkup2 = libUnderTest.buildMarkup(aCompleteList);
        expect(sMarkup).toEqual(sMarkup2);
        
        var aIncompleteList2 = libUnderTest.stripBlanksAndPunctuations(aCompleteList);
        expect(aIncompleteList.length).toEqual(aIncompleteList2.length);
        
        compare2Lists(libUnderTest, aIncompleteList, aIncompleteList2);
    });
    
    
    it("test idempotency of 'completeList': a completed list cannot be completed any more.", function() {
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var aIncompleteList = [{Position: 1, Type: "Integer"},
                               {Position: 2, Type: "Integer"},
                               {Position: 3, Type: "Integer"},
                               {Position: 4, Type: "Integer"},
                               {Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {Position: 7, Type: "KeyValue.List"},
                               {Position: 8, Type: "Integer"},
                               {Position: 9, Type: "Integer"}];
        
        var aCompletedList = libUnderTest.completeList(aIncompleteList, sMarkup);
        var aDoubleCompletedList = libUnderTest.completeList(aCompletedList, sMarkup);
        
        expect(aCompletedList.length).toEqual(17);
        expect(aCompletedList.length).toEqual(aDoubleCompletedList.length);
        
        compare2Lists(libUnderTest, aCompletedList, aDoubleCompletedList);

    });
    
    
    it("test idempotency of 'stripBlanksAndPunctuations': a stripped list cannot be stripped any more.", function() {
        var aCompleteList = [{Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {Position: 2, Type: "Integer"},
                             {Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 4, Type: "Integer"},
                             {Position: 5, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 6, Type: "Integer"},
                             {Position: 7, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 8, Type: "Integer"},
                             {Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {Position: 14, Type: "KeyValue.List"},
                             {Position: 15, Type: "Integer"},
                             {Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {Position: 17, Type: "Integer"}];
        
        var aStrippedList = libUnderTest.stripBlanksAndPunctuations(aCompleteList);
        var aDoubleStrippedList = libUnderTest.stripBlanksAndPunctuations(aStrippedList);
        
        expect(aStrippedList.length).toEqual(aDoubleStrippedList.length);
        expect(aStrippedList.length).toEqual(9);
        
        compare2Lists(libUnderTest, aStrippedList, aDoubleStrippedList);
    });
    
    
    it("formatter function: build markup from a complete annotations list", function() {
        var aCompleteList = [{Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {Position: 2, Type: "Integer"},
                             {Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 4, Type: "Integer"},
                             {Position: 5, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 6, Type: "Integer"},
                             {Position: 7, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {Position: 8, Type: "Integer"},
                             {Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {Position: 14, Type: "KeyValue.List"},
                             {Position: 15, Type: "Integer"},
                             {Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {Position: 17, Type: "Integer"},
                             {Position: 18, Type: "KeyValue.List", Action: 'REMOVE'},
                             {Position: 19, Type: "Word", FixedValue: 'Ignore Me!', Action: 'REMOVE'}];
        
        var sMarkup = libUnderTest.buildMarkup(aCompleteList);
        
        var sExpectedMarkup =  "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        expect(sMarkup).toEqual(sExpectedMarkup);
    });
    
    
    it("formatter function: build beautified markup from a complete annotations list", function() {
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var aIncompleteList = [{Position: 1, Type: "Integer"},
                               {Position: 2, Type: "Integer"},
                               {Position: 3, Type: "Integer"},
                               {Position: 4, Type: "Integer"},
                               {Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {Position: 7, Type: "KeyValue.List"},
                               {Position: 8, Type: "Integer"},
                               {Position: 9, Type: "Integer"} ];
        
        var aCompleteList = libUnderTest.completeList(aIncompleteList, sMarkup);
        aCompleteList.push({Position: 10, Type: "KeyValue.List", Action: 'REMOVE'});
        aCompleteList.push({Position: 11, Type: "Word", FixedValue: 'Ignore Me!', Action: 'REMOVE'});
        
        var sBeautifiedMarkup = libUnderTest.buildBeautifiedMarkup(aCompleteList);
        
        var sExpectedMarkup =  "&lt;<Integer1>- <Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>";
        expect(sBeautifiedMarkup).toEqual(sExpectedMarkup);
    });
    
    
    it("recalculate positions of complete annotations list, including sub-annotations. The list contains annotations from several entry types", function() {
        // Sorted by entry type Id. But positions are shuffled and need to be re-calculated.
        var aShuffledList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {"EntryTypeId.Id": "AA", Position: 13, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "AA", Position: 5, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 4, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: " "},
                             {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.List"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 2, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {"EntryTypeId.Id": "BB", Position: -13, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: -3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: -5, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: -4, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: -6, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: -11, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: -8, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: -16, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {"EntryTypeId.Id": "BB", Position: -10, Type: "Word", FixedValue: "CONSTANT1"},
                             {"EntryTypeId.Id": "BB", Position: -7, Type: "BlankOrPunctuation", FixedValue: " "},
                             {"EntryTypeId.Id": "BB", Position: -12, Type: "Word", FixedValue: "CONSTANT2"},
                             {"EntryTypeId.Id": "BB", Position: -13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {"EntryTypeId.Id": "BB", Position: -15, Type: "KeyValue.List"},
                             {"EntryTypeId.Id": "BB", Position: -15, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: -15, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: -15, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: -15, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: -14, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: -2, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {"EntryTypeId.Id": "BB", Position: -9, Type: "Integer"}
                             ];
        
        var aSortedList = libUnderTest._recalculatePositions(aShuffledList);
        
        var aExpectedList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.List"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {"EntryTypeId.Id": "AA", Position: 17, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;"},
                             {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- "},
                             {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  "},
                             {"EntryTypeId.Id": "BB", Position: 10, Type: "Word", FixedValue: "CONSTANT1"},
                             {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: " "},
                             {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT2"},
                             {"EntryTypeId.Id": "BB", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":"},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.List"},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "KeyValue.Value", ParentAnnotation:"X"},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "Integer"},
                             {"EntryTypeId.Id": "BB", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :"},
                             {"EntryTypeId.Id": "BB", Position: 17, Type: "Integer"}];
        
        expect(aSortedList.length).toEqual(aExpectedList.length);
        compare2Lists(libUnderTest, aSortedList, aExpectedList);
    });
    
    
    
    it("merge adjacent annotations if the types are Word or BlankOrPunctuation. The list contains annotations from several entry types. Annotations from different entry types must not be merged.", function() {
        // Sorted by entry type Id. Adjacency is determined by index not by position.
        var aOriginalList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 2, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 4, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 5, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 10, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.List", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 16, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 17, Type: "Word", FixedValue: "END", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 0, Type: "Word", FixedValue: "BEGINNING", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: "REMOVE"},
                             {"EntryTypeId.Id": "BB", Position: 2, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 4, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 5, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 9, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 10, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT1", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "Word", FixedValue: "CONSTANT2", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.List", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 16, Type: "Integer", Action: ""}
                             ];
        
        var aMergedList = libUnderTest._mergeAdjacentAnnotations(aOriginalList);
        
        var aExpectedList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;: : :", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 2, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 4, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 5, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 10, Type: "BlankOrPunctuation", FixedValue: "- &gt;  ", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT1CONSTANT2", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 14, Type: "Word", FixedValue: "CONSTANT2", Action: "REMOVE"},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.List", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "AA", Position: 16, Type: "Integer"},
                             {"EntryTypeId.Id": "AA", Position: 17, Type: "Word", FixedValue: "END", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 0, Type: "Word", FixedValue: "BEGINNING", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: "REMOVE"},
                             {"EntryTypeId.Id": "BB", Position: 2, Type: "BlankOrPunctuation", FixedValue: ": : :- - ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "BB", Position: 4, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "BB", Position: 5, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 6, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 9, Type: "Integer", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 10, Type: "BlankOrPunctuation", FixedValue: "- &gt;  ", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 11, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: "REMOVE"},
                             {"EntryTypeId.Id": "BB", Position: 12, Type: "Word", FixedValue: "CONSTANT1CONSTANT2", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 14, Type: "Word", FixedValue: "CONSTANT2", Action: "REMOVE"},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.List", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Key", FixedValue:"Key1", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Key", FixedValue:"Key2", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 15, Type: "KeyValue.Value", ParentAnnotation:"X", Action: ""},
                             {"EntryTypeId.Id": "BB", Position: 16, Type: "Integer", Action: ""}
                             ];       

        
        expect(aMergedList.length).toEqual(aExpectedList.length);
        compare2Lists(libUnderTest, aMergedList, aExpectedList);
    });
    
    
    it("recalculate positions of complete annotations list, after new annotations have been added and old ones have been removed", function() {
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var aIncompleteList = [{Position: 1, Type: "Integer"},
                               {Position: 2, Type: "Integer"},
                               {Position: 3, Type: "Integer"},
                               {Position: 4, Type: "Integer"},
                               {Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {Position: 7, Type: "KeyValue.List"},
                               {Position: 8, Type: "Integer"},
                               {Position: 9, Type: "Integer"}];
        
        var aCompleteList = libUnderTest.completeList(aIncompleteList, sMarkup);
        
        sMarkup = libUnderTest.buildBeautifiedMarkup(aCompleteList);
        var sExpectedMarkup =  "&lt;<Integer1>- <Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>";
        expect(sMarkup).toEqual(sExpectedMarkup);
        
        // add new annotation at position 3
        aCompleteList.splice(3, 0, {Position: 12, Type: "Word", FixedValue: "NEW", DisplayName: "NEW"});
        // remove first annotation
        aCompleteList.shift();
        var aSortedList = libUnderTest._recalculatePositions(aCompleteList);
        sMarkup = libUnderTest.buildBeautifiedMarkup(aSortedList);
        
        sExpectedMarkup =  "<Integer1>- NEW<Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>";
        expect(sMarkup).toEqual(sExpectedMarkup);
    });
    
    
    it("insert new annotation (and take merge into consideration)", function() {
        
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var aIncompleteList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 3, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {"EntryTypeId.Id": "AA", Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {"EntryTypeId.Id": "AA", Position: 7, Type: "KeyValue.List"},
                               {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer"},
                               
                               {"EntryTypeId.Id": "BB", Position: 1, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 3, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {"EntryTypeId.Id": "BB", Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {"EntryTypeId.Id": "BB", Position: 7, Type: "KeyValue.List"},
                               {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 9, Type: "Integer"}];
        
        var aCompleteList = libUnderTest.completeAllAnnotationsOfRun(aIncompleteList, 
                [{"Id": "AA", Markup: sMarkup},
                 {"Id": "BB", Markup: sMarkup}]);
        var aCompleteListAA = aCompleteList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "AA";
        });
        var aCompleteListBB = aCompleteList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "BB";
        });
        var sBeautifiedMarkupAA = libUnderTest.buildBeautifiedMarkup(aCompleteListAA);
        var sBeautifiedMarkupBB = libUnderTest.buildBeautifiedMarkup(aCompleteListBB);
        var sOriginalExpectedMarkup =  "&lt;<Integer1>- <Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>";
        expect(sBeautifiedMarkupAA).toEqual(sOriginalExpectedMarkup);
        expect(sBeautifiedMarkupBB).toEqual(sOriginalExpectedMarkup);
        
        // add new annotation NEW before position 11 of entry type AA: I.e. after CONSTANT1. In this case, CONSTANT1 and NEW should be merged to CONSTANT1NEW
        var oNewAnnotation = {"EntryTypeId.Id": "AA", Type: "Word", FixedValue: "NEW", DisplayName: "NEW"};
        var oReferenceAnnotation = aCompleteList[10]; // EntryType ""AA", Position: 11
        var aNewList = libUnderTest.insertAnnotation(aCompleteList, oNewAnnotation,oReferenceAnnotation , false);
        var aNewListAA = aNewList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "AA";
        });
        var aNewListBB = aNewList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "BB";
        });
        sBeautifiedMarkupAA = libUnderTest.buildBeautifiedMarkup(aNewListAA);
        sBeautifiedMarkupBB = libUnderTest.buildBeautifiedMarkup(aNewListBB);
        
        // expect new markup for entry type AA
        expect(sBeautifiedMarkupAA).toEqual("&lt;<Integer1>- <Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1NEW CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>");
     // expect new annotations list for entry type AA. Even after insertion, length stays the same due to merge
        var aExpectedListAfterInsertionAA = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1NEW", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: " ", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 12, Type: "Word", FixedValue: "CONSTANT2", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ":", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 14, Type: "KeyValue.List", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 16, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ''},
                                           {"EntryTypeId.Id": "AA", Position: 17, Type: "Integer", Action: ''}];
        expect(aNewListAA.length).toBe(aExpectedListAfterInsertionAA.length);
        
        compare2Lists(libUnderTest, aNewListAA, aExpectedListAfterInsertionAA);
        
        // expect no change for entry type BB
        expect(sBeautifiedMarkupBB).toEqual(sOriginalExpectedMarkup);
        
                
        // add another annotation NEW after position 7 (after "- ", before Integer4, entry type AA)
        oNewAnnotation = {"EntryTypeId.Id": "AA", Type: "Word", FixedValue: "NEU", DisplayName: "NEU"};
        oReferenceAnnotation = aNewList[6]; // EntryType ""AA", Position: 7
        var aNewList2 = libUnderTest.insertAnnotation(aNewList, oNewAnnotation, oReferenceAnnotation, true);
        aNewListAA = aNewList2.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "AA";
        });
        aNewListBB = aNewList2.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "BB";
        });
        sBeautifiedMarkupAA = libUnderTest.buildBeautifiedMarkup(aNewListAA);
        sBeautifiedMarkupBB = libUnderTest.buildBeautifiedMarkup(aNewListBB);
        
        // expect new markup, expect no merge
        expect(sBeautifiedMarkupAA).toEqual("&lt;<Integer1>- <Integer2>- <Integer3>- NEU<Integer4>&gt;  CONSTANT1NEW CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>");
        aExpectedListAfterInsertionAA = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 8, Type: "Word", FixedValue: "NEU", Action: 'CREATE'},
                                         {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 10, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 11, Type: "Word", FixedValue: "CONSTANT1NEW", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 12, Type: "BlankOrPunctuation", FixedValue: " ", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 13, Type: "Word", FixedValue: "CONSTANT2", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 14, Type: "BlankOrPunctuation", FixedValue: ":", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 15, Type: "KeyValue.List", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 16, Type: "Integer", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 17, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ''},
                                         {"EntryTypeId.Id": "AA", Position: 18, Type: "Integer", Action: ''}];
        
       
       expect(aNewListAA.length).toBe(aExpectedListAfterInsertionAA.length);
       
       compare2Lists(libUnderTest, aNewListAA, aExpectedListAfterInsertionAA);
      
       // expect no change for entry type BB
        expect(sBeautifiedMarkupBB).toEqual(sOriginalExpectedMarkup);
    });
    
    
    it("remove annotation with implicit merge", function() {
        
        // original markup identical for both entry types AA and BB
        var sMarkup = "&lt;<Integer>- <Integer>- <Integer>- <Integer>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List><Integer>: : :<Integer>";
        var aIncompleteList = [{"EntryTypeId.Id": "AA", Position: 1, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 3, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {"EntryTypeId.Id": "AA", Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {"EntryTypeId.Id": "AA", Position: 7, Type: "KeyValue.List"},
                               {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer"},
                               {"EntryTypeId.Id": "AA", Position: 9, Type: "Integer"},
                               
                               {"EntryTypeId.Id": "BB", Position: 1, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 2, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 3, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 4, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 5, Type: "Word", FixedValue: "CONSTANT1"},
                               {"EntryTypeId.Id": "BB", Position: 6, Type: "Word", FixedValue: "CONSTANT2"},
                               {"EntryTypeId.Id": "BB", Position: 7, Type: "KeyValue.List"},
                               {"EntryTypeId.Id": "BB", Position: 8, Type: "Integer"},
                               {"EntryTypeId.Id": "BB", Position: 9, Type: "Integer"}];
        
        var aCompleteList = libUnderTest.completeAllAnnotationsOfRun(aIncompleteList, 
                [{"Id": "AA", Markup: sMarkup},
                 {"Id": "BB", Markup: sMarkup}]);
        var aCompleteListAA = aCompleteList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "AA";
        });
        var aCompleteListBB = aCompleteList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "BB";
        });
        
        var sBeautifiedMarkupAA = libUnderTest.buildBeautifiedMarkup(aCompleteListAA);
        var sBeautifiedMarkupBB = libUnderTest.buildBeautifiedMarkup(aCompleteListBB);
     // original markup identical for both entry types AA and BB
        var sOriginalExpectedMarkup =  "&lt;<Integer1>- <Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1 CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>";
        expect(sBeautifiedMarkupAA).toEqual(sOriginalExpectedMarkup);
        expect(sBeautifiedMarkupBB).toEqual(sOriginalExpectedMarkup);
        
        // remove annotation at position 11 for entry type AA: This is the blank between CONSTANT1 and CONSTANT2.
        // The two annotations CONSTANT1 and CONSTANT2 should be merged into one annotation CONSTANT1CONSTANT2
        var oReferenceAnnotation = aCompleteList[10]; // EntryType ""AA", Position: 11
        var aNewList = libUnderTest.removeAnnotation(aCompleteList, oReferenceAnnotation );
        var aNewCompleteListAA = aNewList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "AA";
        });
        var aNewCompleteListBB = aNewList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "BB";
        });
        sBeautifiedMarkupAA = libUnderTest.buildBeautifiedMarkup(aNewCompleteListAA);
        sBeautifiedMarkupBB = libUnderTest.buildBeautifiedMarkup(aNewCompleteListBB);
        
        // expect new markup for entry type AA: 
        expect(sBeautifiedMarkupAA).toEqual("&lt;<Integer1>- <Integer2>- <Integer3>- <Integer4>&gt;  CONSTANT1CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>");
        // expect new annotations list after merge of 2 consequent <Word> annotations:
        
        
        var aExpectedListAfterRemovalAA = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 8, Type: "Integer", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT1CONSTANT2", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 10, Type: "BlankOrPunctuation", FixedValue: " ", Action: "REMOVE"},
                                           {"EntryTypeId.Id": "AA", Position: 10, Type: "Word", FixedValue: "CONSTANT2", Action: "REMOVE"},
                                           {"EntryTypeId.Id": "AA", Position: 11, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 12, Type: "KeyValue.List", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 13, Type: "Integer", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 14, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                                           {"EntryTypeId.Id": "AA", Position: 15, Type: "Integer", Action: ""}];
        
        compare2Lists(libUnderTest, aNewCompleteListAA, aExpectedListAfterRemovalAA);
        
        // expect no change for entry type BB
        expect(sBeautifiedMarkupBB).toEqual(sOriginalExpectedMarkup);
        expect(aCompleteListBB.length).toEqual(aNewCompleteListBB.length);
        
        
        
        // remove another annotation at position 7 of entry type AA: That is "- " between <Integer3> and <Integer4>  
        oReferenceAnnotation = aNewList[6]; // EntryType ""AA", Position: 7
        aNewList = libUnderTest.removeAnnotation(aNewList, oReferenceAnnotation);
        aNewCompleteListAA = aNewList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "AA";
        });
        aNewCompleteListBB = aNewList.filter(function(oAnnotation){
            return oAnnotation["EntryTypeId.Id"] === "BB";
        });
        sBeautifiedMarkupAA = libUnderTest.buildBeautifiedMarkup(aNewCompleteListAA);
        sBeautifiedMarkupBB = libUnderTest.buildBeautifiedMarkup(aNewCompleteListBB);
        
        // expect new markup for entry type AA
        expect(sBeautifiedMarkupAA).toEqual("&lt;<Integer1>- <Integer2>- <Integer3><Integer4>&gt;  CONSTANT1CONSTANT2:<KeyValue.List1><Integer5>: : :<Integer6>");
        // expect new annotations list after merge of 2 subsequent <Word> annotations. but 2 subsequent <Integer> annotations are not merged
        
        aExpectedListAfterRemovalAA = [{"EntryTypeId.Id": "AA", Position: 1, Type: "BlankOrPunctuation", FixedValue: "&lt;", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 2, Type: "Integer", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 3, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 4, Type: "Integer", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 5, Type: "BlankOrPunctuation", FixedValue: "- ", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 6, Type: "Integer", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 7, Type: "BlankOrPunctuation", FixedValue: "- ", Action: "REMOVE"},
                                       {"EntryTypeId.Id": "AA", Position: 7, Type: "Integer", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 8, Type: "BlankOrPunctuation", FixedValue: "&gt;  ", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 9, Type: "Word", FixedValue: "CONSTANT1CONSTANT2", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 9, Type: "BlankOrPunctuation", FixedValue: " ", Action: "REMOVE"},
                                       {"EntryTypeId.Id": "AA", Position: 9, Type: "Word", FixedValue: "CONSTANT2", Action: "REMOVE"},
                                       {"EntryTypeId.Id": "AA", Position: 10, Type: "BlankOrPunctuation", FixedValue: ":", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 11, Type: "KeyValue.List", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 12, Type: "Integer", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 13, Type: "BlankOrPunctuation", FixedValue: ": : :", Action: ""},
                                       {"EntryTypeId.Id": "AA", Position: 14, Type: "Integer", Action: ""}];
        
        compare2Lists(libUnderTest, aNewCompleteListAA, aExpectedListAfterRemovalAA);
        
        // expect no change for entry type BB
        expect(sBeautifiedMarkupBB).toEqual(sOriginalExpectedMarkup);
        expect(aCompleteListBB.length).toEqual(aNewCompleteListBB.length);
        
    });
    
    
    /**
     * check that these 2 lists are identical:
     * - they produce the same markup
     * - they have the same number of elements, in the same order
     * - the elements have the same values for fields "Position", "EntryTypeId.Id", "Type", "FixedValue", and "Action".
     * - sub -annotations must not change
     */
    function compare2Lists(libUnderTest, aActualList, aExpectedList){
        
        expect(aActualList.length).toBe(aExpectedList.length);
        for (var index=0; index < aActualList.length; index++){
            var actualAnno = aActualList[index];
            var expectedAnno = aExpectedList[index];
            
            expect(actualAnno["EntryTypeId.Id"]).toEqual(expectedAnno["EntryTypeId.Id"]);
            // recalculate_Positions ignores the position of the annotation is logically deleted. The position may have any value.
            if (expectedAnno.Action !== 'REMOVE'){
                expect(actualAnno.Position).toEqual(expectedAnno.Position);
            }
            expect(actualAnno.Type).toEqual(expectedAnno.Type);
            expect(actualAnno.Action).toEqual(expectedAnno.Action);
            expect(actualAnno.FixedValue).toEqual(expectedAnno.FixedValue);
            // Top annotations may be created, deleted, and the type may be changed.
            // Due to an implicit merge 2 lists may be effectively equivalent even though the annotations have different IDs.
            // Sub-annotations may not be changed.
            if (expectedAnno.Parentannotation){
                expect(actualAnno.Id).toEqual(expectedAnno.Id);
                expect(actualAnno.Action).toBeNull();
            }
        }
        
        // we're after the side-effect: _recalculatePositions also adds fields "DisplayName".
        var aEnhancedExpectedList = libUnderTest._recalculatePositions(aExpectedList);
        var aEnhancedActualList = libUnderTest._recalculatePositions(aActualList);
        var sBeautifiedMarkupExpected = libUnderTest.buildBeautifiedMarkup(aEnhancedExpectedList);
        var sBeautifiedMarkupActual = libUnderTest.buildBeautifiedMarkup(aEnhancedActualList);
        expect(sBeautifiedMarkupActual).toBe(sBeautifiedMarkupExpected);
    }   
    

});