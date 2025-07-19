# Platform maturity assessment prototype

This repo contains a basic prototype for a platform maturity assessment.

On answering the questions you get a spider diagram and a matrix to indicate where you are on a map right now.

You can copy the URL to share the form in its current state, for example [this pre-filled form](https://steve-fenton.github.io/pilot-assessment/?investment_1=1&investment_2=1&investment_3=2&investment_4=1&adoption_1=1&adoption_2=2&adoption_3=2&adoption_4=2&interfaces_1=2&interfaces_2=3&interfaces_3=3&interfaces_4=4&operations_1=3&operations_2=3&operations_3=2&operations_4=1&measurement_1=3&measurement_2=4&measurement_3=4&measurement_4=4)

![Screenshot showing the questions, and a results panel with a spider diagram, scores, and heatmap](https://github.com/user-attachments/assets/711c3cd6-678a-41ea-b5ca-f6351a9e7801)

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
