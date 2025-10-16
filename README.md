# Platform maturity assessment prototype

This repo contains a basic prototype for a platform maturity assessment.

On answering the questions you get a spider diagram and a matrix to indicate where you are on a map right now.

You can copy the URL to share the form in its current state, for example [this pre-filled form](https://cloud-native-platform-engineering.github.io/pemm-assessment/?investment_1=1&investment_2=1&investment_3=2&investment_4=1&adoption_1=1&adoption_2=2&adoption_3=2&adoption_4=2&interfaces_1=2&interfaces_2=3&interfaces_3=3&interfaces_4=4&operations_1=3&operations_2=3&operations_3=2&operations_4=1&measurement_1=3&measurement_2=4&measurement_3=4&measurement_4=4)

When [giving feedback](https://docs.google.com/forms/d/1SW8NE-7E2zjhoun4jklRPmH5sYgJ_3rTw2D_FoOwViA/viewform) please use these shareable URLs to help folks see what you see.

<img width="1064" height="1114" alt="A screenshot showing the questions" src="https://github.com/user-attachments/assets/909d70d6-0a4c-4cc9-8988-646aa50484f6" />

<img width="1076" height="1201" alt="A screenshot showing the assessment results, a spider chart, heatmap matrix, and list of scores" src="https://github.com/user-attachments/assets/18d4b7db-1f52-4458-8970-acfbdf20c987" />

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

## Content Management and Translations

The assessment content is now managed through YAML files in the `/data/` directory for easy updates and translations:

- `questions-en.yaml` - English (default language)
- `questions-[lang].yaml` - Translations

To add a language, add the YAML file and add the language to the list in `index.html`.

### Updating Questions and Content

**⚠️ IMPORTANT: When updating `questions-en.yaml`, you MUST also update the corresponding translations:**

1. **Make changes to the English source file first**: Edit `data/questions-en.yaml`
2. **Update translation**: Apply equivalent changes to `data/questions-[lang].yaml`
3. **Verify consistency**: Ensure all three files have:
   - Same category IDs and structure
   - Same question IDs within each category
   - Same option values (1-5) for scoring consistency
   - Translated text for all user-facing content

### What Needs Translation

When updating content, ensure these elements are translated in all language files:

- `metadata` section (titles, messages, UI text)
- Category `name` fields
- Question `text` content
- Option `level` and `description` text

### Testing Translations

After updating translations:

1. Test each language using URL parameters: `?lang=en`, `?lang=zh`, `?lang=es`
2. Verify all text displays correctly
3. Ensure functionality works across all languages
4. Test the complete assessment flow in each language
