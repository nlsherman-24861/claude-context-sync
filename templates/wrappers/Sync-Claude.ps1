# PowerShell wrapper script for claude-context-sync (Windows)
# Provides convenient functions and aliases for Windows PowerShell/PowerShell Core

#Requires -Version 5.1

function Sync-Claude {
    <#
    .SYNOPSIS
        PowerShell wrapper for claude-context-sync
    
    .DESCRIPTION
        This function provides a convenient entry point for claude-context-sync
        with PowerShell-friendly parameter handling and error reporting.
    
    .PARAMETER Arguments
        Arguments to pass to claude-context-sync
    
    .EXAMPLE
        Sync-Claude all
        
    .EXAMPLE
        Sync-Claude sync --target chat
        
    .EXAMPLE
        Sync-Claude validate
    #>
    [CmdletBinding()]
    param(
        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$Arguments = @()
    )
    
    try {
        # Check if claude-context-sync is available
        $command = Get-Command claude-context-sync -ErrorAction SilentlyContinue
        if (-not $command) {
            Write-Error "claude-context-sync not found in PATH. Please install it with: npm install -g claude-context-sync"
            return
        }
        
        # Execute claude-context-sync with all arguments
        & claude-context-sync @Arguments
    }
    catch {
        Write-Error "Failed to execute claude-context-sync: $($_.Exception.Message)"
    }
}

# Create convenient aliases
Set-Alias -Name sync-claude -Value Sync-Claude -Description "Alias for Sync-Claude function"
Set-Alias -Name cs -Value Sync-Claude -Description "Short alias for Sync-Claude function"

# Export functions and aliases
Export-ModuleMember -Function Sync-Claude -Alias sync-claude, cs

# If script is run directly (not imported as module), execute with arguments
if ($MyInvocation.InvocationName -ne '.') {
    Sync-Claude @args
}