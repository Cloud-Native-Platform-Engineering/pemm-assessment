# Platform maturity assessment prototype

This repo contains a basic prototype for a platform maturity assessment.

On answering the questions you get a spider diagram and a matrix to indicate where you are on a map right now.

You can copy the URL to share the form in its current state, for example [this pre-filled form](https://cloud-native-platform-engineering.github.io/pemm-assessment/?investment_1=1&investment_2=1&investment_3=2&investment_4=1&adoption_1=1&adoption_2=2&adoption_3=2&adoption_4=2&interfaces_1=2&interfaces_2=3&interfaces_3=3&interfaces_4=4&operations_1=3&operations_2=3&operations_3=2&operations_4=1&measurement_1=3&measurement_2=4&measurement_3=4&measurement_4=4)

When [giving feedback](https://docs.google.com/forms/d/1SW8NE-7E2zjhoun4jklRPmH5sYgJ_3rTw2D_FoOwViA/viewform) please use these shareable URLs to help folks see what you see.

<img width="2127" height="1422" alt="A screenshot showing the layout of question in the assessment" src="https://github.com/user-attachments/assets/4c9beaa0-09ca-4a87-9d08-6c20c17fd2f7" />

<img width="1939" height="1883" alt="A screenshot showing the assessment results, a spider chart, heatmap matrix, and list of scores" src="https://github.com/user-attachments/assets/7cceafdd-0907-49e3-b2db-df59b0cadb7b" />

## HTML requirements

The form requires a few items and conventions.

- Use a fieldset to group questions by categories.
- Use a suffix for each set of radio buttons.
- Use an integer value that matches the maturity level

```html
<!-- Form with id of "maturity-form" -->
<form id="maturity-form">

<fieldset>
    <!--
        Legend with:
        data-category=[internal name of category - must match radio names]
        text: Display name for category
     -->
    <legend data-category="category">Display Name</legend>

    <label>
        <!--
            Radio with a name that matches the data-category with a numeric suffix, for example category_1, category_2.

            The value must be an integer.
        -->
        <input type="radio" name="category_1" value="1">
        Option display text
    </label>

</fieldset>

</form>
```

For the output, you need the following:

```html
<canvas id="maturity-spider"></canvas>
<table id="maturity-matrix"></table>
<div id="maturity-scores" class="scores"></div>
```
