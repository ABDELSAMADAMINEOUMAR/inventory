$Utf8NoBom = New-Object System.Text.UTF8Encoding $False

function Replace-File {
    param($Path, $OldStr, $NewStr)
    $Content = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    if ($Content.Contains($OldStr)) {
        $Content = $Content.Replace($OldStr, $NewStr)
        [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
        Write-Output ("Updated " + $Path)
    } else {
        Write-Output ("Old string not found in " + $Path)
    }
}

$styleOld = ".modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}"
$styleNew = ".modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: #e5e7eb;
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.input-highlight {
  background: #eff6ff !important;
  border-color: #dbeafe !important;
}

[data-theme="dark"] .input-highlight {
  background: rgba(59, 130, 246, 0.15) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
}
[data-theme="dark"] .modal-footer {
  background: rgba(0, 0, 0, 0.4);
}"

Replace-File "css\style.css" $styleOld.Replace("`r`n", "`n") $styleNew.Replace("`r`n", "`n")

Replace-File "js\products.js" '<input class="input" type="text" id="fPrice"' '<input class="input input-highlight" type="text" id="fPrice"'
Replace-File "js\products.js" "UI.icon('save', '', 16)" "UI.icon('package', '', 16)"

Replace-File "js\sales.js" '<input class="input" id="sCustomerPhone"' '<input class="input input-highlight" id="sCustomerPhone"'
Replace-File "js\sales.js" "UI.icon('save', '', 16)" "UI.icon('package', '', 16)"